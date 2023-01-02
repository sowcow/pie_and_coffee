require_relative 'gradations'

$result_file = 'result.png'


def draw_sector r, a1, a2, color
  x0 = r
  y0 = r

  a1 = to_rad a1
  a2 = to_rad a2

  x1 = x0 + r * Math.cos(a1)
  y1 = y0 + r * Math.sin(a1)

  x2 = x0 + r * Math.cos(a2)
  y2 = y0 + r * Math.sin(a2)

  r2 = r * 10

  x3 = x0 + r2 * Math.cos(a1)
  y3 = y0 + r2 * Math.sin(a1)

  x4 = x0 + r2 * Math.cos((a1+a2)/2)
  y4 = y0 + r2 * Math.sin((a1+a2)/2)

  x5 = x0 + r2 * Math.cos(a2)
  y5 = y0 + r2 * Math.sin(a2)

  if $bezier
    if $cubic_bezier
      use_center = rand(0...13) == 0
      cx1 = r
      cy1 = r
      if !use_center
        aa = random_angle
        cx1 = x0 + r * Math.cos(aa)
        cy1 = y0 + r * Math.sin(aa)
      end

      use_center = rand(0...13) == 0
      cx2 = r
      cy2 = r
      if !use_center
        aa = random_angle
        cx2 = x0 + r * Math.cos(aa)
        cy2 = y0 + r * Math.sin(aa)
      end

      %|-stroke #{color.inspect} -fill #{color.inspect} -draw "path 'M #{x1},#{y1} C #{cx1},#{cy1} #{cx2},#{cy2} #{x2},#{y2} L #{x5},#{y5} L #{x4},#{y4} L #{x3},#{y3} Z'"|
    else
      use_center = rand(0...3) == 0
      cx = r
      cy = r
      if !use_center
        aa = random_angle
        cx = x0 + r * Math.cos(aa)
        cy = y0 + r * Math.sin(aa)
      end

      %|-stroke #{color.inspect} -fill #{color.inspect} -draw "path 'M #{x1},#{y1} Q #{cx},#{cy} #{x2},#{y2} L #{x5},#{y5} L #{x4},#{y4} L #{x3},#{y3} Z'"|
    end
  else
    %'-stroke #{color.inspect} -fill #{color.inspect} -draw "polygon #{x1},#{y1} #{x3},#{y3} #{x4},#{y4} #{x5},#{y5} #{x2},#{y2}"'
  end
end

def to_rad deg
  deg / 180.0 * Math::PI
end

def draw r, sectors, convert=''
  size = r*2
  center = "#{r},#{r}"
  draws = []
  inverse = []
  draws << %'-draw "translate #{center} circle 0,0 #{r},0"'
  sectors.each { |s|
    inverse << draw_sector(r, s[:a1], s[:a2], s[:color])
  }

  bg = 'none'

  cmd = <<-END.strip.lines.map(&:strip).join(' ')
    convert -size #{size}x#{size}
    #{convert}
    xc:#{bg}
    -stroke #$circle
    -fill #$circle
    #{draws.join "\n"}
    base.png
  END
  system cmd

  system 'convert base.png -alpha extract mask.png'

  cmd = <<-END.strip.lines.map(&:strip).join(' ')
    convert base.png
    #{convert}
    #{inverse.join "\n"}
    #$result_file
  END
  system cmd

  cmd = <<-END.strip.lines.map(&:strip).join(' ')
    convert #$result_file mask.png
    #{convert}
    -alpha Off
    -compose CopyOpacity
    -composite
    #$result_file
  END
  system cmd


  if $have_grid && convert == ''
    divisor = 12
    step = 360.0 / divisor
    lines = divisor.times.map { |i|
      a = i * step
      x1 = r
      y1 = r
      x2 = r + r*Math.cos(to_rad a)
      y2 = r + r*Math.sin(to_rad a)
      %|-draw "line #{x1},#{y1} #{x2},#{y2}"|
    }
    cmd = <<-END.strip.lines.map(&:strip).join(' ')
      convert #$result_file
        -stroke white
        -fill white
        #{lines * "\n"}
        #$result_file
    END
    system cmd
  end
end

def get_percents radius, colors
  s = Math::PI * radius * radius

  stuff = `convert #$result_file -format %c histogram:info:`

  colors.map do |color|
    got = stuff.lines.grep(/#{color}/).first
    count = Integer (got || '0')[/\d+/]
    (count / s) * 100
  end
end

def random_angle
  division = 12
  step = 360.0 / division
  division.times.map { |i| i * step }.sample
end

$circle = 'white'

radius = 500
test_radius = 50

def percent_fits p
  p >= $min_percent
end

colors = Gradations.make $colors

sectors = []
begin
  sectors = colors.map { |c|
    { color: c,
      a1: random_angle,
      a2: random_angle,
    }
  }

  puts "drawing: #{sectors.inspect}"
  draw test_radius, sectors, '+antialias'
  ps = get_percents test_radius, colors
  p ps
end until ps.all? { |p| percent_fits p }


draw radius, sectors

BEGIN {
  $have_grid = false
  $bezier = true
  $cubic_bezier = true
  $colors = 7
  $min_percent = 7
}

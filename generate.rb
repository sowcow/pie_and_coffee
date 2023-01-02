100.times {
  system 'ruby run.rb'
  count = Dir['many/*.png'].count
  new_name = "#{count + 1}.png"
  system "cp result.png many/#{new_name}"
}

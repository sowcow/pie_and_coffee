module Gradations
  module_function

  # array of colors from black but not including white itself
  def make steps
    white = 'FF'.to_i 16
    step = white.to_f / steps

    gradations = steps.times.map { |i|
      format (step * i).floor
    }
  end

  # matches imagemagick hist
  def format int
    core = int.to_s(16).rjust 2, ?0
    "##{core * 3}FF".upcase
  end
end

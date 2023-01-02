group = '7cubic'

place = File.join __dir__, 'front/public', group

system "cp -r many #{place.inspect}"

# not collecting names
# I'll have just 1..100 for any groups
# and groups hard-coded!

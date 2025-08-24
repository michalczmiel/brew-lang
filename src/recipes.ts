const glitchCoffeeOrigamiHot = `
# Glitch Coffee Origami Hot Recipe
# Paper: Karita Wave

temperature 86..90
dose 14.5
water 260
method origami

at 0:00
  pour 30
  duration 0:05
end

at 0:20 pour 30 duration 0:05 end

at 0:50
  pour 100
  duration 0:15
end

at 1:20
  pour 100
  duration 0:15
end
`;

const jamesHoffmannAeropress = `
# James Hoffmann Ultimate AeroPress

temperature 85..99
water 200
dose 11

# don't rinse paper

at 0:00
  pour 200
  # then place the plunger on top
end

at 2:00
  # gently swirl
end

at 2:30
  # press
end
`;

const tetsuKasuyaHybridMethod = `

# Tetsu Kasuya Hybrid method

dose 20
water 260
method hario switch

at 0:00
  temperature 90
  # open switch
  pour 60
end

at 0:30
  temperature 90
  pour 60
end

at 1:15
  temperature 70
  # close switch
  pour 160
end

at 1:45
  # open switch
end

`;

export const recipes = {
  glitchCoffeeOrigamiHot,
  jamesHoffmannAeropress,
  tetsuKasuyaHybridMethod,
} as const;

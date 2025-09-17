const glitchCoffeeOrigamiHot = `
# Glitch Coffee Origami Hot Recipe

temperature 86..90
dose 14.5
brewer origami
filter karita wave

at 0:00..0:05 pour 40 end
at 0:20..0:45 pour 100 end
at 1:10..1:25 pour 100 end
`;

const jamesHoffmannAeropress = `
# James Hoffmann Ultimate AeroPress

temperature 85..99
dose 11
brewer aeropress
filter paper

at 0:00
  -- don't rinse paper
  pour 200
  -- after pouring, place the plunger on top
end

at 2:00
  swirl
end

at 2:30
  -- press
end
`;

const tetsuKasuyaHybridMethod = `
# Tetsu Kasuya Hybrid method

dose 20
brewer hario switch
filter paper

at 0:00
  temperature 90
  -- open switch
  pour 60
end

at 0:30
  temperature 90
  pour 60
end

at 1:15
  temperature 70
  -- close switch
  pour 160
end

at 1:45
  -- open switch
end

`;

export const recipes = {
  glitchCoffeeOrigamiHot,
  jamesHoffmannAeropress,
  tetsuKasuyaHybridMethod,
} as const;

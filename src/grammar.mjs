import * as ohm from "ohm-js";

export const grammar = ohm.grammar(String.raw`
  BrewLang {
    recipe = (method | step | temperature | water | dose | comment | newline)*

    method = "method" " " (~newline any)+ newline?
    dose = "dose" " " number
    temperature = "temperature" " " (range | number)+ newline?
    water = "water" " " number newline?

    step = "step" " " "{" newline? instruction+ " "* "}"
    instruction = " "* (start | finish | pour | duration | comment) newline

    duration = "duration" " " duration_number
    finish = "finish" " " duration_number
    start = "start" " " duration_number
    pour = "pour" " " number

    comment = "#" (~newline any)*
    newline = "\n"

    number = real_number | whole_number
    whole_number = digit+
    real_number = digit+ "." digit+

    range = number "." "." number
    duration_number = whole_number ":" whole_number
  }
`);

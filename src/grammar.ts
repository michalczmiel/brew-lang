import * as ohm from "ohm-js";

export const grammar = ohm.grammar(String.raw`
  BrewLang {
    recipe = (line | comment | newline)*
    line = (method | step | temperature | water | dose) " "* comment? newline?

    method = "method" " " (~(newline | comment) any)+
    dose = "dose" " " number
    temperature = "temperature" " " (range | number)+
    water = "water" " " number

    step = "at" " " duration_number " "* comment? newline? instruction* "end"
    instruction = " "* (duration | pour | temperature | comment) (" " | newline | &"end")
    duration = "duration" " " duration_number
    pour = "pour" " " number

    comment = "#" (~newline any)*
    newline = "\n"

    range = whole_number "." "." whole_number

    number = real_number | whole_number
    whole_number = digit+
    real_number = digit+ "." digit+

    duration_number = whole_number ":" whole_number
  }
`);

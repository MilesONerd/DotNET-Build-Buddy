module Calculator

let add x y = x + y
let subtract x y = x - y
let multiply x y = x * y
let divide x y = 
    if y = 0 then 
        failwith "Cannot divide by zero"
    else 
        x / y

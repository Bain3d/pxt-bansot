# Bansot


## Feature

- Designed for robotic projects over microbit
- On board battery source
- Drive 8x servos and 4x DC motors and the same time (with 3.7v battery source to VM)
- Drive 2x Micro Stepper Motors
- On board buzzer


## License

MIT

## Code example
~~~javascript
bansot.Forward(150, 100) //car forward(speed 150, delay 100ms) 

bansot.TurnRight(150, 100) //turn right(speed 150, dalay 100ms to stop)

bansot.CountCross(150, 0, 0, 0)//(speed,left cross No,right cross no,stop delay)
/*  Count Cross and stop
    You need 4 linetrack sensor attched to pin 12 13 14 15

                  |       |
                  | black |
                  | line  |
                  |       |
      P15    P14  |       |   P13   P12
                  |       |
    
    Speed: moving speed
    left cross No.: The number of crosses you need P15 sensor to count
    right cross No.: The number of crosses you need P12 sensor to count
    stop delay: delay time and stop when the car get the target cross.
    Use one side count numbers at a time left another size count number "0";
*/

bansot.sonar(bansot.echoPinUnit.MicroSeconds)
// get the distence by the ultrasonic sensor attched to P14(trig) and P15(echo)
~~~

## Products images
![BK-1](https://raw.githubusercontent.com/Bain3d/pxt-bansot/master/images/BK-1.jpg)
![BK-1 Parts](https://raw.githubusercontent.com/Bain3d/pxt-bansot/master/images/BK-1_Parts.jpg)
![S4 suit](https://raw.githubusercontent.com/Bain3d/pxt-bansot/master/images/S4CreativeSuit.jpg)
![S4 Parts](https://raw.githubusercontent.com/Bain3d/pxt-bansot/master/images/S4CeativeSuitParts.jpg)

## Supported targets

* for PXT/microbit
(The metadata above is needed for package search.)

## Get out products
microbit creative suit: 
https://item.taobao.com/item.htm?spm=a2oq0.12575281.0.0.4f6b1deb9MD87J&ft=t&id=611606827117

BK-1 mecanum robo-tank suit: 
https://item.taobao.com/item.htm?spm=a2oq0.12575281.0.0.30d31debRJjzFC&ft=t&id=611119177609

## Prodcuts instructions
BK-1 robot
https://github.com/Bain3d/BK-1/blob/master/doc/BK-1%20Intelligent%20Robot%20Kit%20Assembly%20Instruction.pdf


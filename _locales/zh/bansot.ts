
/*
modified from pxt-servo/servodriver.ts
load dependency
"bansot": "file:../pxt-bansot"
*/

//% color="#2eaa55" weight=10 icon="\uf1a3" block="Bansot"
namespace bansot {
    const PCA9685_ADDRESS = 0x40
    const MODE1 = 0x00
    const MODE2 = 0x01
    const SUBADR1 = 0x02
    const SUBADR2 = 0x03
    const SUBADR3 = 0x04
    const PRESCALE = 0xFE
    const LED0_ON_L = 0x06
    const LED0_ON_H = 0x07
    const LED0_OFF_L = 0x08
    const LED0_OFF_H = 0x09
    const ALL_LED_ON_L = 0xFA
    const ALL_LED_ON_H = 0xFB
    const ALL_LED_OFF_L = 0xFC
    const ALL_LED_OFF_H = 0xFD

    const STP_CHA_L = 2047
    const STP_CHA_H = 4095

    const STP_CHB_L = 1
    const STP_CHB_H = 2047

    const STP_CHC_L = 1023
    const STP_CHC_H = 3071

    const STP_CHD_L = 3071
    const STP_CHD_H = 1023

    // HT16K33 commands
    const HT16K33_ADDRESS = 0x70
    const HT16K33_BLINK_CMD = 0x80
    const HT16K33_BLINK_DISPLAYON = 0x01
    const HT16K33_BLINK_OFF = 0
    const HT16K33_BLINK_2HZ = 1
    const HT16K33_BLINK_1HZ = 2
    const HT16K33_BLINK_HALFHZ = 3
    const HT16K33_CMD_BRIGHTNESS = 0xE0

    export enum Servos {
        S1 = 0x01,
        S2 = 0x02,
        S3 = 0x03,
        S4 = 0x04,
        S5 = 0x05,
        S6 = 0x06,
        S7 = 0x07,
        S8 = 0x08
    }

    export enum Motors {
        M1A = 0x1,
        M1B = 0x2,
        M2A = 0x3,
        M2B = 0x4
    }

    export enum Steppers {
        M1 = 0x1,
        M2 = 0x2
    }

    export enum Turns {
        //% blockId="T1B4" block="1/4"
        T1B4 = 90,
        //% blockId="T1B2" block="1/2"
        T1B2 = 180,
        //% blockId="T1B0" block="1"
        T1B0 = 360,
        //% blockId="T2B0" block="2"
        T2B0 = 720,
        //% blockId="T3B0" block="3"
        T3B0 = 1080,
        //% blockId="T4B0" block="4"
        T4B0 = 1440,
        //% blockId="T5B0" block="5"
        T5B0 = 1800
    }

    export enum echoPinUnit {
        //% block="μs"
        MicroSeconds,
        //% block="cm"
        Centimeters,
        //% block="inches"
        Inches
    }

    let initialized = false
    let initializedMatrix = false
    let bansot_neoStrip: neopixel.Strip;
    let matBuf = pins.createBuffer(17);

    function i2cwrite(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2ccmd(addr: number, value: number) {
        let buf = pins.createBuffer(1)
        buf[0] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2cread(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }

    function initPCA9685(): void {
        i2cwrite(PCA9685_ADDRESS, MODE1, 0x00)
        setFreq(50);
        for (let idx = 0; idx < 16; idx++) {
            setPwm(idx, 0, 0);
        }
        initialized = true
    }

    function setFreq(freq: number): void {
        // Constrain the frequency
        let prescaleval = 25000000;
        prescaleval /= 4096;
        prescaleval /= freq;
        prescaleval -= 1;
        let prescale = prescaleval; //Math.Floor(prescaleval + 0.5);
        let oldmode = i2cread(PCA9685_ADDRESS, MODE1);
        let newmode = (oldmode & 0x7F) | 0x10; // sleep
        i2cwrite(PCA9685_ADDRESS, MODE1, newmode); // go to sleep
        i2cwrite(PCA9685_ADDRESS, PRESCALE, prescale); // set the prescaler
        i2cwrite(PCA9685_ADDRESS, MODE1, oldmode);
        control.waitMicros(5000);
        i2cwrite(PCA9685_ADDRESS, MODE1, oldmode | 0xa1);
    }

    function setPwm(channel: number, on: number, off: number): void {
        if (channel < 0 || channel > 15)
            return;

        let buf = pins.createBuffer(5);
        buf[0] = LED0_ON_L + 4 * channel;
        buf[1] = on & 0xff;
        buf[2] = (on >> 8) & 0xff;
        buf[3] = off & 0xff;
        buf[4] = (off >> 8) & 0xff;
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);
    }


    function setStepper(index: number, dir: boolean): void {
        if (index == 1) {
            if (dir) {
                setPwm(0, STP_CHA_L, STP_CHA_H);
                setPwm(2, STP_CHB_L, STP_CHB_H);
                setPwm(1, STP_CHC_L, STP_CHC_H);
                setPwm(3, STP_CHD_L, STP_CHD_H);
            } else {
                setPwm(3, STP_CHA_L, STP_CHA_H);
                setPwm(1, STP_CHB_L, STP_CHB_H);
                setPwm(2, STP_CHC_L, STP_CHC_H);
                setPwm(0, STP_CHD_L, STP_CHD_H);
            }
        } else {
            if (dir) {
                setPwm(4, STP_CHA_L, STP_CHA_H);
                setPwm(6, STP_CHB_L, STP_CHB_H);
                setPwm(5, STP_CHC_L, STP_CHC_H);
                setPwm(7, STP_CHD_L, STP_CHD_H);
            } else {
                setPwm(7, STP_CHA_L, STP_CHA_H);
                setPwm(5, STP_CHB_L, STP_CHB_H);
                setPwm(6, STP_CHC_L, STP_CHC_H);
                setPwm(4, STP_CHD_L, STP_CHD_H);
            }
        }
    }

    function stopMotor(index: number) {
        setPwm((index - 1) * 2, 0, 0);
        setPwm((index - 1) * 2 + 1, 0, 0);
    }

    function matrixInit() {
        i2ccmd(HT16K33_ADDRESS, 0x21);// turn on oscillator
        i2ccmd(HT16K33_ADDRESS, HT16K33_BLINK_CMD | HT16K33_BLINK_DISPLAYON | (0 << 1));
        i2ccmd(HT16K33_ADDRESS, HT16K33_CMD_BRIGHTNESS | 0xF);
    }

    function matrixShow() {
        matBuf[0] = 0x00;
        pins.i2cWriteBuffer(HT16K33_ADDRESS, matBuf);
    }

    /**
     * Servo Execute
     * @param index Servo Channel; eg: S1
     * @param degree [0-180] degree of servo; eg: 0, 90, 180
    */
    //% blockId=bansot_servo block="Servo|%index|degree %degree"
    //% weight=100
    //% blockGap=50
    //% degree.min=0 degree.max=180
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function Servo(index: Servos, degree: number): void {
        if (!initialized) {
            initPCA9685()
        }
        // 50hz: 20,000 us
        let v_us = (degree * 1800 / 180 + 600) // 0.6 ~ 2.4
        let value = v_us * 4096 / 20000
        setPwm(index + 7, 0, value)
    }



    //% blockId=bansot_motor_run block="Motor|%index|speed %speed"
    //% weight=85
    //% speed.min=-255 speed.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function MotorRun(index: Motors, speed: number): void {
        if (!initialized) {
            initPCA9685()
        }
        speed = speed * 16; // map 255 to 4096
        if (speed >= 4096) {
            speed = 4095
        }
        if (speed <= -4096) {
            speed = -4095
        }
        if (index > 4 || index <= 0)
            return
        let pp = (index - 1) * 2
        let pn = (index - 1) * 2 + 1
        if (speed >= 0) {
            setPwm(pp, 0, speed)
            setPwm(pn, 0, 0)
        } else {
            setPwm(pp, 0, 0)
            setPwm(pn, 0, -speed)
        }
    }


    /**
     * Execute two motors at the same time
     * @param motor1 First Motor; eg: M1A, M1B
     * @param speed1 [-255-255] speed of motor; eg: 150, -150
     * @param motor2 Second Motor; eg: M2A, M2B
     * @param speed2 [-255-255] speed of motor; eg: 150, -150
    */
    //% blockId=bansot_motor_dual block="Motor|%motor1|speed %speed1|%motor2|speed %speed2"
    //% weight=84
    //% speed1.min=-255 speed1.max=255
    //% speed2.min=-255 speed2.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function MotorRunDual(motor1: Motors, speed1: number, motor2: Motors, speed2: number): void {
        MotorRun(motor1, speed1);
        MotorRun(motor2, speed2);
    }

    /**
     * Execute single motors with delay
     * @param index Motor Index; eg: M1A, M1B, M2A, M2B
     * @param speed [-255-255] speed of motor; eg: 150, -150
     * @param delay seconde delay to stop; eg: 1
    */
    //% blockId=bansot_motor_rundelay block="Motor|%index|speed %speed|delay %delay|s"
    //% weight=81
    //% speed.min=-255 speed.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function MotorRunDelay(index: Motors, speed: number, delay: number): void {
        MotorRun(index, speed);
        basic.pause(delay * 1000);
        MotorRun(index, 0);
    }



    //% blockId=bansot_stop block="Motor Stop|%index|"
    //% weight=80
    export function MotorStop(index: Motors): void {
        MotorRun(index, 0);
    }

    //% blockId=bansot_stop_all block="Motor Stop All"
    //% weight=79
    export function MotorStopAll(): void {
        for (let idx = 1; idx <= 4; idx++) {
            stopMotor(idx);
        }
    }

    /**
     * Forward car with delay
     * @param speed [-255-255] speed of motor; eg: 150, -150
     * @param delay seconde delay to stop; eg: 100
    */
    //% blockId=bansot_forward block="Forward|Speed %speed |Delay(ms) %delay"
    //% weight=79
    //% speed.min=-255 speed.max=255
    export function Forward(speed: number, delay: number): void {
        MotorRun(1, speed);
        MotorRun(2, speed);
        basic.pause(delay);
        MotorRun(1, 0);
        MotorRun(2, 0);
    }

    /**
     * Back car with delay
     * @param speed [-255-255] speed of motor; eg: 150, -150
     * @param delay seconde delay to stop; eg: 100
    */
    //% blockId=bansot_back block="Back|speed %speed |delay(ms) %delay"
    //% weight=79
    //% speed.min=-255 speed.max=255
    export function Back(speed: number, delay: number): void {
        MotorRun(1, -speed);
        MotorRun(2, -speed);
        basic.pause(delay);
        MotorRun(1, 0);
        MotorRun(2, 0);
    }

    /**
     * Turn left with delay
     * @param speed [-255-255] speed of motor; eg: 150, -150
     * @param delay seconde delay to stop; eg: 100
    */
    //% blockId=bansot_turn_left block="Turn left|Speed %speed |Delay(ms) %delay"
    //% weight=79
    //% speed.min=-255 speed.max=255
    export function TurnLeft(speed: number, delay: number): void {
        MotorRun(1, -speed);
        MotorRun(2, speed);
        basic.pause(delay);
        MotorRun(1, 0);
        MotorRun(2, 0);
    }

    /**
     * Turn right with delay
     * @param speed [-255-255] speed of motor; eg: 150, -150
     * @param delay seconde delay to stop; eg: 100
    */
    //% blockId=bansot_turn_right block="Turn right|Speed %speed |Delay(ms) %delay"
    //% weight=79
    //% speed.min=-255 speed.max=255
    export function TurnRight(speed: number, delay: number): void {
        MotorRun(1, speed);
        MotorRun(2, -speed);
        basic.pause(delay);
        MotorRun(1, 0);
        MotorRun(2, 0);
    }

    /**
     * Car left speed
     * @param speed [-255-255] speed of motor; eg: 150, -150
    */
    //% blockId=bansot_left_speed block="Left Speed %speed"
    //% weight=79
    //% speed.min=-255 speed.max=255
    export function LeftSpeed(speed: number): void {
        MotorRun(1, speed);
    }

    /**
     * Car right speed
     * @param speed [-255-255] speed of motor; eg: 150, -150
    */
    //% blockId=bansot_right_speed block="Right Speed %speed"
    //% weight=79
    //% speed.min=-255 speed.max=255
    export function RightSpeed(speed: number): void {
        MotorRun(2, speed);
    }

    /**
     * Car Dual speed delay
     * @param speed [-255-255] speed of motor; eg: 150, -150
    */
    //% blockId=bansot_dual_speed_delay block="Left speed %speedL|Right speed %speedR|Delay(ms) %delay"
    //% weight=79
    //% speed.min=-255 speed.max=255
    export function DualSpeedDelay(speedL: number, speedR: number, delay: number): void {
        MotorRun(1, speedL);
        MotorRun(2, speedR);
        basic.pause(delay);
        MotorRun(1, 0);
        MotorRun(2, 0);
    }

    /**
     * Tracking count cross
     * @param speed [-255-255] speed of motor; eg: 150, -150
     * @param delay seconde delay to stop; eg: 0
    */
    //% blockId=bansot_count_cross block="Tracking & countting|Speed %speed|Left cross No. %crossL|Right cross No. %crossR|Stop Delay(ms) %delay"
    //% weight=79
    //% speed.min=-255 speed.max=255
    //% crossL.min=0 crossL.max=99
    //% crossR.min=0 crossR.max=99
    export function CountCross(speed: number, crossL: number, crossR: number, delay: number): void {
        let TL = 0;
        let TR = 0;
        let CL = 0;
        let CR = 0;
        while (crossL > CL || crossR > CR) {
            if (pins.digitalReadPin(DigitalPin.P13) == 1 && pins.digitalReadPin(DigitalPin.P14) == 1) {
                MotorRun(2, speed);
                MotorRun(1, speed);
            } else if (pins.digitalReadPin(DigitalPin.P13) == 0 && pins.digitalReadPin(DigitalPin.P14) == 0) {
                MotorRun(2, 0);
                MotorRun(1, 0);
            } else {
                if (pins.digitalReadPin(DigitalPin.P14) == 0) {
                    MotorRun(1, 0);
                    MotorRun(2, speed);
                } else {
                    MotorRun(1, speed);
                    MotorRun(2, 0);
                }
            }
            if (pins.digitalReadPin(DigitalPin.P12) == 0) {
                while (pins.digitalReadPin(DigitalPin.P12) == 0) {
                    MotorRun(2, speed);
                    MotorRun(1, speed);
                    if (pins.digitalReadPin(DigitalPin.P15) == 0) {
                        while (pins.digitalReadPin(DigitalPin.P15) == 0);
                        CL += 1;
                    }
                }
                CR += 1;
            }
            if (pins.digitalReadPin(DigitalPin.P15) == 0) {
                while (pins.digitalReadPin(DigitalPin.P15) == 0) {
                    MotorRun(2, speed);
                    MotorRun(1, speed);
                    if (pins.digitalReadPin(DigitalPin.P12) == 0) {
                        while (pins.digitalReadPin(DigitalPin.P12) == 0);
                        CR += 1;
                    }
                }
                CL += 1;
            }
        }
        basic.pause(delay);
        MotorRun(1, 0);
        MotorRun(2, 0);
    }
    /**
     * Init RGB pixels mounted
     */
    //% blockId="bansot_rgb" block="RGB"
    //% weight=5
    export function rgb(): neopixel.Strip {
        if (!bansot_neoStrip) {
            bansot_neoStrip = neopixel.create(DigitalPin.P16, 4, NeoPixelMode.RGB)
        }
        return bansot_neoStrip;
    }


    let distanceMS = 0;
    /**
     * Get the distance by the ultrasonic sensor at 14(trig) an 15 (echo)
     * @param unit desired conversion unit
     * @param maxCmDistance maximum distance in centimeters (default is 500)
     */
    //% blockId=bansot_sonar block="Get distance by %unit"
    export function sonar(unit: echoPinUnit, maxCmDistance = 60): number {
        // send pulse
        let trig = DigitalPin.P14;
        let echo = DigitalPin.P15;
        let speedFix = 0.65;
        pins.setPull(trig, PinPullMode.PullNone);
        pins.digitalWritePin(trig, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);

        // read pulse
        const d = pins.pulseIn(echo, PulseValue.High, (maxCmDistance * 58) / speedFix);
        if (d != 0) {
            distanceMS = d;
        }
        switch (unit) {
            case echoPinUnit.Centimeters: return Math.idiv(distanceMS, 58 * speedFix);
            case echoPinUnit.Inches: return Math.idiv(distanceMS, 148 * speedFix);
            default: return distanceMS;
        }
    }
}

//% color="#31C7D5" weight=10 icon="\uf11b"  block="PS Controller"
namespace ps2controller {
    const rbits = hex`
    008040C020A060E0109050D030B070F0088848C828A868E8189858D838B878F8
    048444C424A464E4149454D434B474F40C8C4CCC2CAC6CEC1C9C5CDC3CBC7CFC
    028242C222A262E2129252D232B272F20A8A4ACA2AAA6AEA1A9A5ADA3ABA7AFA
    068646C626A666E6169656D636B676F60E8E4ECE2EAE6EEE1E9E5EDE3EBE7EFE
    018141C121A161E1119151D131B171F1098949C929A969E9199959D939B979F9
    058545C525A565E5159555D535B575F50D8D4DCD2DAD6DED1D9D5DDD3DBD7DFD
    038343C323A363E3139353D333B373F30B8B4BCB2BAB6BEB1B9B5BDB3BBB7BFB
    078747C727A767E7179757D737B777F70F8F4FCF2FAF6FEF1F9F5FDF3FBF7FFF`

    let needPoll = false;

    function rbit(value: number): number {
        return rbits[value] || 0x00;
    }

    function rbuffer(b: Buffer): Buffer {
        let output = pins.createBuffer(b.length);
        for (let i = 0; i < b.length; i++) {
            let n = b[i]
            output[i] = rbit(n)
        }
        return output
    }

    let chipSelect = DigitalPin.P12
    let pad = pins.createBuffer(6);
    let connected = false;
    let serviceStarted = false;
    

    const poll_cmd = hex
        `014200000000000000`

    function send_command(transmit: Buffer): Buffer {
        // 处理位顺序
        transmit = rbuffer(transmit)
        let receive = pins.createBuffer(transmit.length);

        pins.digitalWritePin(chipSelect, 0);
        
        // 实际发送命令
        for (let i = 0; i < transmit.length; i++) {
            receive[i] = pins.spiWrite(transmit[i]);
        }
        pins.digitalWritePin(chipSelect, 1)

        // 处理位顺序
        receive = rbuffer(receive)
        return receive
    }

    export enum PS2Button {
        //% blockId="Left" block="Left"
        Left,
        //% blockId="Down" block="Down"
        Down,
        //% blockId="Right" block="Right"
        Right,
        //% blockId="Up" block="Up"
        Up,
        //% blockId="Start" block="Start"
        Start,
        //% blockId="Analog_Left" block="Analog left"
        Analog_Left,
        //% blockId="Analog_Right" block="Analog right"
        Analog_Right,
        //% blockId="Select" block="Select"
        Select,
        //% blockId="Square" block="□ Button"
        Square,
        //% blockId="Cross" block="× Button"
        Cross,
        //% blockId="Circle" block="○ Button"
        Circle,
        //% blockId="Triangle" block="△ Button"
        Triangle,
        //% blockId="R1" block="R1 Button"
        R1,
        //% blockId="L1" block="L1 Button"
        L1,
        //% blockId="R2" block="R2 Button"
        R2,
        //% blockId="L2" block="L2 Button"
        L2,
        // //% blockId="Buttons" block="按键(空缺)"
        // Buttons,
    };
    export enum PS2Analog {
        //% blockId="RX" block="Right X"
        RX,
        //% blockId="RY" block="Right Y"
        RY,
        //% blockId="LX" block="Left X"
        LX,
        //% blockId="LY" block="Left Y"
        LY,
    }

    function ps_control_service(): void {
        
        pins.digitalWritePin(chipSelect, 1)
        pins.spiPins(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13)
        pins.spiFormat(8, 3)
        pins.spiFrequency(250000)
        serviceStarted = true;

    }

    //% blockId=bansot_button_pressed block="|%b| is pressed"
    //% weight=99
    //% blockGap=50
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function button_pressed(b: PS2Button): boolean {
        // poll();
        needPoll = true;
        if(serviceStarted == false) {
            ps_control_service();
        }
        if (!connected) return false
        switch (b) {
            case PS2Button.Left:
                return pad[0] & 0x80 ? false : true;
            case PS2Button.Down:
                return pad[0] & 0x40 ? false : true;
            case PS2Button.Right:
                return pad[0] & 0x20 ? false : true;
            case PS2Button.Up:
                return pad[0] & 0x10 ? false : true;
            case PS2Button.Start:
                return pad[0] & 0x08 ? false : true;
            case PS2Button.Analog_Left:
                return pad[0] & 0x04 ? false : true;
            case PS2Button.Analog_Right:
                return pad[0] & 0x02 ? false : true;
            case PS2Button.Select:
                return pad[0] & 0x01 ? false : true;
            case PS2Button.Square:
                return pad[1] & 0x80 ? false : true;
            case PS2Button.Cross:
                return pad[1] & 0x40 ? false : true;
            case PS2Button.Circle:
                return pad[1] & 0x20 ? false : true;
            case PS2Button.Triangle:
                return pad[1] & 0x10 ? false : true;
            case PS2Button.R1:
                return pad[1] & 0x08 ? false : true;
            case PS2Button.L1:
                return pad[1] & 0x04 ? false : true;
            case PS2Button.R2:
                return pad[1] & 0x02 ? false : true;
            case PS2Button.L2:
                return pad[1] & 0x01 ? false : true;
            // case PS2Button.Buttons:
            //     return ~((pad[1] << 8) | pad[0]) & 0xffff;
        }
        return false;
    }
    //% blockId=bansot_analog_value block="Analog |%b| value"
    //% weight=99
    //% blockGap=50
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function analogValue(b: PS2Analog): number {
        // poll();
        needPoll = true;
        if(serviceStarted == false) {
            ps_control_service();
        }
        if (!connected) return 0x00
        switch (b) {
            case PS2Analog.RX:
                return pad[2] - 0x80;
            case PS2Analog.RY:
                return pad[3] - 0x80;
            case PS2Analog.LX:
                return pad[4] - 0x80;
            case PS2Analog.LY:
                return pad[5] - 0x80;
        }
        return 0;
    }

    function poll(): boolean {
        let buf = send_command(poll_cmd)
        if (buf[2] != 0x5a) {
            return false;
        }
        for (let i = 0; i < 6; i++) {
            pad[i] = buf[3 + i];
        }
        connected = true
        return true
    }

    basic.forever(function () {
        if (needPoll) {
            poll();
        }
    })

}
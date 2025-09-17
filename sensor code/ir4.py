import smbus
import time
import struct
import board
import busio
import adafruit_ads1x15.ads1115 as ADS
from adafruit_ads1x15.analog_in import AnalogIn
import RPi.GPIO as GPIO

# Configuration variables
IR_SENSOR_PIN = 16          # GPIO pin for IR proximity sensor
IR_SENSOR_ACTIVE_LOW = True # Set to True if sensor is active low, False if active high
ACCESS_DOOR_PIN = 25        # GPIO pin for access door sensor
DELAY_AFTER_TRIGGER = 0.1   # Delay in seconds after trigger before taking readings
READING_INTERVAL = 0.005      # Interval between readings in seconds (200ms)
NUM_READINGS = 10           # Number of readings to take
ALPHA = 0.3                 # Exponential weighting factor (0-1, higher = more weight to recent values)

# AS726X I2C address
AS726X_ADDR = 0x49

# Register addresses
AS726x_DEVICE_TYPE = 0x00
AS726x_HW_VERSION = 0x01
AS726x_CONTROL_SETUP = 0x04
AS726x_INT_T = 0x05
AS726x_DEVICE_TEMP = 0x06
AS726x_LED_CONTROL = 0x07

AS72XX_SLAVE_STATUS_REG = 0x00
AS72XX_SLAVE_WRITE_REG = 0x01
AS72XX_SLAVE_READ_REG = 0x02

# AS7262 Registers (Visible light sensor)
AS7262_V = 0x08      # Violet
AS7262_B = 0x0A      # Blue
AS7262_G = 0x0C      # Green
AS7262_Y = 0x0E      # Yellow
AS7262_O = 0x10      # Orange
AS7262_R = 0x12      # Red
AS7262_V_CAL = 0x14  # Violet calibrated
AS7262_B_CAL = 0x18  # Blue calibrated
AS7262_G_CAL = 0x1C  # Green calibrated
AS7262_Y_CAL = 0x20  # Yellow calibrated
AS7262_O_CAL = 0x24  # Orange calibrated
AS7262_R_CAL = 0x28  # Red calibrated

# AS7263 Registers (Near-IR sensor)
AS7263_R = 0x08      # R channel
AS7263_S = 0x0A      # S channel
AS7263_T = 0x0C      # T channel
AS7263_U = 0x0E      # U channel
AS7263_V = 0x10      # V channel
AS7263_W = 0x12      # W channel
AS7263_R_CAL = 0x14  # R calibrated
AS7263_S_CAL = 0x18  # S calibrated
AS7263_T_CAL = 0x1C  # T calibrated
AS7263_U_CAL = 0x20  # U calibrated
AS7263_V_CAL = 0x24  # V calibrated
AS7263_W_CAL = 0x28  # W calibrated

# Status register bits
AS72XX_SLAVE_TX_VALID = 0x02
AS72XX_SLAVE_RX_VALID = 0x01

# Sensor types
SENSORTYPE_AS7261 = 0x3D
SENSORTYPE_AS7262 = 0x3E
SENSORTYPE_AS7263 = 0x3F

# Timing constants
POLLING_DELAY = 0.005  # 5ms
MAX_RETRIES = 3
TIMEOUT = 3.0  # 3 seconds

class AS726X:
    def __init__(self, i2c_bus=1, address=AS726X_ADDR):
        """Initialize AS726X sensor on Raspberry Pi"""
        self.bus = smbus.SMBus(i2c_bus)
        self.address = address
        self.sensor_version = 0
        
    def begin(self, gain=3, measurement_mode=3):
        """Initialize the sensor with given parameters"""
        try:
            print("Initializing AS726X sensor...")
            
            # Get sensor version
            self.sensor_version = self.virtual_read_register(AS726x_HW_VERSION)
            print(f"Sensor version: 0x{self.sensor_version:02X}")
            
            # Check if it's a valid AS726X sensor
            if (self.sensor_version != SENSORTYPE_AS7261 and 
                self.sensor_version != SENSORTYPE_AS7262 and 
                self.sensor_version != SENSORTYPE_AS7263):
                print(f"Invalid sensor version: 0x{self.sensor_version:02X}")
                return False
            
            print("Valid AS726X sensor detected")
            
            # Set to 12.5mA (minimum) bulb current
            print("Setting bulb current...")
            if self.set_bulb_current(0) != 0:
                print("Failed to set bulb current")
                return False
            
            # Turn off bulb to avoid heating
            print("Disabling bulb...")
            if self.disable_bulb() != 0:
                print("Failed to disable bulb")
                return False
            
            # Set indicator current to 8mA (maximum)
            print("Setting indicator current...")
            if self.set_indicator_current(3) != 0:
                print("Failed to set indicator current")
                return False
            
            # Turn off indicator to save power
            print("Disabling indicator...")
            if self.disable_indicator() != 0:
                print("Failed to disable indicator")
                return False
            
            # Set integration time (50 * 2.8ms = 140ms)
            print("Setting integration time...")
            if self.set_integration_time(50) != 0:
                print("Failed to set integration time")
                return False
            
            # Set gain
            print(f"Setting gain to {gain}...")
            if self.set_gain(gain) != 0:
                print("Failed to set gain")
                return False
            
            # Set measurement mode
            print(f"Setting measurement mode to {measurement_mode}...")
            if self.set_measurement_mode(measurement_mode) != 0:
                print("Failed to set measurement mode")
                return False
            
            print("Sensor initialization complete")
            return True
            
        except Exception as e:
            print(f"Error initializing sensor: {e}")
            return False
                
    def get_sensor_type(self):
        """Get sensor type string"""
        if self.sensor_version == SENSORTYPE_AS7261:
            return "AS7261"
        elif self.sensor_version == SENSORTYPE_AS7262:
            return "AS7262"
        elif self.sensor_version == SENSORTYPE_AS7263:
            return "AS7263"
        else:
            return "Unknown"
    
    def get_wavelengths(self):
        """Get wavelengths supported by the sensor"""
        if self.sensor_version == SENSORTYPE_AS7262:
            # AS7262 (Visible) wavelengths in nm
            return [450, 500, 550, 570, 600, 650]
        elif self.sensor_version == SENSORTYPE_AS7263:
            # AS7263 (Near-IR) wavelengths in nm
            return [610, 680, 730, 760, 810, 860]
        else:
            return [450, 500, 550, 570, 600, 650]  # Default to visible
    
    def take_measurements(self):
        """Take measurements from the sensor"""
        try:
           # print("Starting measurement...")
            
            # Clear DATA_RDY flag
            if self.clear_data_available() != 0:
                raise Exception("Failed to clear data available flag")
           # print("Cleared data available flag")
            
            # Set to mode 3 for one shot measurement
            if self.set_measurement_mode(3) != 0:
                raise Exception("Failed to set measurement mode")
           # print("Set measurement mode to 3")
            
            # Wait for data to be ready
            start_time = time.time()
            poll_count = 0
            while not self.data_available():
                time.sleep(POLLING_DELAY)
                poll_count += 1
                if poll_count % 100 == 0:  # Print every 500ms
                    print(f"Waiting for data... ({poll_count * 5}ms)")
                if time.time() - start_time > TIMEOUT:
                    raise Exception("Timeout waiting for data")
            
            #print(f"Data ready after {poll_count * 5}ms")
            return True
            
        except Exception as e:
            print(f"Error taking measurements: {e}")
            return False
    
    def get_calibrated_values(self):
        """Get calibrated values from the sensor"""
        try:
            #print(f"Reading calibrated values for sensor type: 0x{self.sensor_version:02X}")
            
            if self.sensor_version == SENSORTYPE_AS7262:
                # AS7262 - Visible light sensor
                values = []
                cal_addresses = [AS7262_V_CAL, AS7262_B_CAL, AS7262_G_CAL, 
                               AS7262_Y_CAL, AS7262_O_CAL, AS7262_R_CAL]
                names = ['Violet', 'Blue', 'Green', 'Yellow', 'Orange', 'Red']
                
                for i, (addr, name) in enumerate(zip(cal_addresses, names)):
                    val = self.get_calibrated_value(addr)
                    print(f"  {name} (0x{addr:02X}): {val}")
                    values.append(val)
                
                return values
                
            elif self.sensor_version == SENSORTYPE_AS7263:
                # AS7263 - Near-IR sensor
                values = []
                cal_addresses = [AS7263_R_CAL, AS7263_S_CAL, AS7263_T_CAL, 
                               AS7263_U_CAL, AS7263_V_CAL, AS7263_W_CAL]
                names = ['R (610nm)', 'S (680nm)', 'T (730nm)', 'U (760nm)', 'V (810nm)', 'W (860nm)']
                
                for i, (addr, name) in enumerate(zip(cal_addresses, names)):
                    val = self.get_calibrated_value(addr)
                   # print(f"  {name} (0x{addr:02X}): {val}")
                    values.append(val)
                
                return values
                
            else:
                print(f"Unsupported sensor version: 0x{self.sensor_version:02X}")
                # Try to read raw values instead
                raw_values = self.get_raw_values()
                print(f"Raw values: {raw_values}")
                return [float(v) for v in raw_values]
                
        except Exception as e:
            print(f"Error reading calibrated values: {e}")
            return [-1.0, -1.0, -1.0, -1.0, -1.0, -1.0]
    
    def get_calibrated_value(self, cal_address):
        """Read a 4-byte calibrated value from the sensor"""
        try:
           # print(f"    Reading from address 0x{cal_address:02X}")
            b0 = self.virtual_read_register(cal_address + 0)
            b1 = self.virtual_read_register(cal_address + 1)
            b2 = self.virtual_read_register(cal_address + 2)
            b3 = self.virtual_read_register(cal_address + 3)
            
           # print(f"    Raw bytes: {b0:02X} {b1:02X} {b2:02X} {b3:02X}")
            
            if b0 == 0xFF or b1 == 0xFF or b2 == 0xFF or b3 == 0xFF:
                print(f"    Error reading from address 0x{cal_address:02X}")
                return -1.0
            
            # Channel calibrated values are stored big-endian
            cal_bytes = (b0 << 24) | (b1 << 16) | (b2 << 8) | b3
            
            # Convert to float
            float_val = struct.unpack('>f', cal_bytes.to_bytes(4, 'big'))[0]
           # print(f"    Float value: {float_val}")
            
            return float_val
            
        except Exception as e:
            print(f"Error reading calibrated value at 0x{cal_address:02X}: {e}")
            return -1.0
    
    def get_raw_values(self):
        """Get raw 16-bit values from the sensor"""
        try:
            if self.sensor_version == SENSORTYPE_AS7262:
                # AS7262 - Visible light sensor raw registers
                raw_addresses = [AS7262_V, AS7262_B, AS7262_G, AS7262_Y, AS7262_O, AS7262_R]
            elif self.sensor_version == SENSORTYPE_AS7263:
                # AS7263 - Near-IR sensor raw registers
                raw_addresses = [AS7263_R, AS7263_S, AS7263_T, AS7263_U, AS7263_V, AS7263_W]
            else:
                return [0, 0, 0, 0, 0, 0]
                
            values = []
            names = ['Ch0', 'Ch1', 'Ch2', 'Ch3', 'Ch4', 'Ch5']
            for i, addr in enumerate(raw_addresses):
                # Read 16-bit value (high byte first)
                high = self.virtual_read_register(addr)
                low = self.virtual_read_register(addr + 1)
                if high == 0xFF or low == 0xFF:
                    print(f"  {names[i]} (0x{addr:02X}): Error reading")
                    values.append(-1)
                else:
                    val = (high << 8) | low
                    #print(f"  {names[i]} (0x{addr:02X}): {val} (0x{high:02X}{low:02X})")
                    values.append(val)
            return values
                
        except Exception as e:
            print(f"Error reading raw values: {e}")
            return [-1, -1, -1, -1, -1, -1]
    
    def data_available(self):
        """Check if data is ready"""
        try:
            value = self.virtual_read_register(AS726x_CONTROL_SETUP)
            return (value & (1 << 1)) != 0  # Bit 1 is DATA_RDY
        except:
            return False
    
    def clear_data_available(self):
        """Clear the data ready flag"""
        try:
            value = self.virtual_read_register(AS726x_CONTROL_SETUP)
            value &= ~(1 << 1)  # Clear DATA_RDY bit
            return self.virtual_write_register(AS726x_CONTROL_SETUP, value)
        except:
            return -1
    
    def set_measurement_mode(self, mode):
        """Set measurement mode (0-3)"""
        try:
            if mode > 3:
                mode = 3
            value = self.virtual_read_register(AS726x_CONTROL_SETUP)
            value &= 0b11110011  # Clear BANK bits
            value |= (mode << 2)  # Set BANK bits
            return self.virtual_write_register(AS726x_CONTROL_SETUP, value)
        except:
            return -1
    
    def set_gain(self, gain):
        """Set gain (0-3: 1x, 3.7x, 16x, 64x)"""
        try:
            if gain > 3:
                gain = 3
            value = self.virtual_read_register(AS726x_CONTROL_SETUP)
            value &= 0b11001111  # Clear GAIN bits
            value |= (gain << 4)  # Set GAIN bits
            return self.virtual_write_register(AS726x_CONTROL_SETUP, value)
        except:
            return -1
    
    def set_integration_time(self, integration_value):
        """Set integration time (0-255, time = 2.8ms * value)"""
        try:
            return self.virtual_write_register(AS726x_INT_T, integration_value)
        except:
            return -1
    
    def disable_bulb(self):
        """Disable the onboard bulb"""
        try:
            value = self.virtual_read_register(AS726x_LED_CONTROL)
            value &= ~(1 << 3)  # Clear bulb bit
            return self.virtual_write_register(AS726x_LED_CONTROL, value)
        except:
            return -1
    
    def set_bulb_current(self, current):
        """Set bulb current (0-3: 12.5mA, 25mA, 50mA, 100mA)"""
        try:
            if current > 3:
                current = 3
            value = self.virtual_read_register(AS726x_LED_CONTROL)
            value &= 0b11001111  # Clear ICL_DRV bits
            value |= (current << 4)  # Set ICL_DRV bits
            return self.virtual_write_register(AS726x_LED_CONTROL, value)
        except:
            return -1
    
    def disable_indicator(self):
        """Disable the indicator LED"""
        try:
            value = self.virtual_read_register(AS726x_LED_CONTROL)
            value &= ~(1 << 0)  # Clear indicator bit
            return self.virtual_write_register(AS726x_LED_CONTROL, value)
        except:
            return -1
    
    def set_indicator_current(self, current):
        """Set indicator current (0-3)"""
        try:
            if current > 3:
                current = 3
            value = self.virtual_read_register(AS726x_LED_CONTROL)
            value &= 0b11111001  # Clear ICL_IND bits
            value |= (current << 1)  # Set ICL_IND bits
            return self.virtual_write_register(AS726x_LED_CONTROL, value)
        except:
            return -1
    
    def virtual_read_register(self, virtual_addr):
        """Read from a virtual register"""
        retries = 0
        
        # Check for pending data
        status = self.read_register(AS72XX_SLAVE_STATUS_REG)
        if status == 0xFF:
            return 0xFF
        if (status & AS72XX_SLAVE_RX_VALID) != 0:
            # Clear pending data
            self.read_register(AS72XX_SLAVE_READ_REG)
        
        # Wait for WRITE flag to clear
        while True:
            status = self.read_register(AS72XX_SLAVE_STATUS_REG)
            if status == 0xFF:
                return 0xFF
            if (status & AS72XX_SLAVE_TX_VALID) == 0:
                break
            time.sleep(POLLING_DELAY)
            retries += 1
            if retries > MAX_RETRIES:
                return 0xFF
        
        # Send virtual register address
        if self.write_register(AS72XX_SLAVE_WRITE_REG, virtual_addr) != 0:
            return 0xFF
        
        retries = 0
        # Wait for READ flag to be set
        while True:
            status = self.read_register(AS72XX_SLAVE_STATUS_REG)
            if status == 0xFF:
                return 0xFF
            if (status & AS72XX_SLAVE_RX_VALID) != 0:
                break
            time.sleep(POLLING_DELAY)
            retries += 1
            if retries > MAX_RETRIES:
                return 0xFF
        
        return self.read_register(AS72XX_SLAVE_READ_REG)
    
    def virtual_write_register(self, virtual_addr, data_to_write):
        """Write to a virtual register"""
        retries = 0
        
        # Wait for WRITE register to be empty
        while True:
            status = self.read_register(AS72XX_SLAVE_STATUS_REG)
            if status == 0xFF:
                return -1
            if (status & AS72XX_SLAVE_TX_VALID) == 0:
                break
            time.sleep(POLLING_DELAY)
            retries += 1
            if retries > MAX_RETRIES:
                return -1
        
        # Send virtual register address with write bit set
        if self.write_register(AS72XX_SLAVE_WRITE_REG, virtual_addr | 0x80) != 0:
            return -1
        
        retries = 0
        # Wait for WRITE register to be empty again
        while True:
            status = self.read_register(AS72XX_SLAVE_STATUS_REG)
            if status == 0xFF:
                return -1
            if (status & AS72XX_SLAVE_TX_VALID) == 0:
                break
            time.sleep(POLLING_DELAY)
            retries += 1
            if retries > MAX_RETRIES:
                return -1
        
        # Send the data
        return self.write_register(AS72XX_SLAVE_WRITE_REG, data_to_write)
    
    def read_register(self, addr):
        """Read from a physical I2C register"""
        try:
            return self.bus.read_byte_data(self.address, addr)
        except Exception as e:
            print(f"I2C read error at address {addr}: {e}")
            return 0xFF
    
    def write_register(self, addr, val):
        """Write to a physical I2C register"""
        try:
            self.bus.write_byte_data(self.address, addr, val)
            return 0
        except Exception as e:
            print(f"I2C write error at address {addr}: {e}")
            return -1

def exponential_weighted_average(previous, current, alpha):
    """Calculate exponential weighted average"""
    if previous is None:
        return current
    return alpha * current + (1 - alpha) * previous

def is_ir_sensor_active():
    """Check if IR sensor is active based on configuration"""
    ir_state = GPIO.input(IR_SENSOR_PIN)
    if IR_SENSOR_ACTIVE_LOW:
        return not ir_state  # Active when input is LOW
    else:
        return ir_state  # Active when input is HIGH

# Initialize GPIO for IR sensor and access door
GPIO.setmode(GPIO.BCM)
GPIO.setup(IR_SENSOR_PIN, GPIO.IN)
GPIO.setup(ACCESS_DOOR_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)  # Assuming door closed = HIGH

# Initialize alcohol sensor
try:
    i2c_ads = busio.I2C(board.SCL, board.SDA)
    ads = ADS.ADS1115(i2c_ads)
    ads.gain = 1
    alcohol_chan = AnalogIn(ads, ADS.P0)
    alcohol_sensor_available = True
    print("Alcohol sensor initialized successfully")
except Exception as e:
    print(f"Failed to initialize alcohol sensor: {e}")
    alcohol_sensor_available = False

# Main code
sensor_type = "None"

try:
    # Initialize I2C (bus 1 is default on Raspberry Pi)
    sensor = AS726X(i2c_bus=1)
    if sensor.begin(gain=3, measurement_mode=3):
        sensor_type = sensor.get_sensor_type()
        time.sleep(1)
        print(f'Sensor type: {sensor_type}')
        print(f'Ready to read on wavelengths: {sensor.get_wavelengths()}')
    else:
        print("Failed to initialize sensor")
        sensor_type = "Failed"
except Exception as error:
    print(f"Initialization error: {error}")

# State variables
last_trigger_state = False
last_door_state = True  # Assume door is initially closed
trigger_active = False
readings_taken = 0

print("Waiting for IR sensor trigger...")
print(f"IR sensor is configured as {'active low' if IR_SENSOR_ACTIVE_LOW else 'active high'}")

try:
    while True:
        # Read IR sensor state
        ir_active = is_ir_sensor_active()
        
        # Read access door state
        door_state = GPIO.input(ACCESS_DOOR_PIN)
        
        # Check for access door state change
        if not door_state and last_door_state:
            print("WARNING: Access door opened, please close access door.")
        elif door_state and not last_door_state:
            print("Access door closed.")
        
        # Check for rising edge (trigger activated)
        if ir_active and not last_trigger_state:
            print("Test sample placed. Starting measurement sequence...")
            trigger_active = True
            readings_taken = 0
            
            # Wait for the specified delay
            time.sleep(DELAY_AFTER_TRIGGER)
            
            # Check if sample is still in place after delay
            if not is_ir_sensor_active():
                print("ERROR: Test sample removed before all readings are taken")
                trigger_active = False
                last_trigger_state = False
                continue
            
            # Initialize arrays for weighted averaging
            weighted_spectral_values = None
            weighted_alcohol_value = None
            
            # Take multiple readings with exponential weighting
            for i in range(NUM_READINGS):
                # Check if sample is still in place
                if not is_ir_sensor_active():
                    print("ERROR: Test sample removed before all readings are taken")
                    break
                
                print(f"Taking reading {i+1}/{NUM_READINGS}...")
                
                # Get spectral values
                spectral_values = [-1.0, -1.0, -1.0, -1.0, -1.0, -1.0]
                try:
                    if sensor.take_measurements():
                        spectral_values = sensor.get_calibrated_values()
                except Exception as error:
                    print(f"Measurement error: {error}")
                
                # Get alcohol value
                alcohol_value = -1.0
                if alcohol_sensor_available:
                    try:
                        alcohol_value = alcohol_chan.voltage
                    except Exception as e:
                        print(f"Error reading alcohol sensor: {e}")
                        alcohol_value = -1.0
                
                # Apply exponential weighting
                if weighted_spectral_values is None:
                    weighted_spectral_values = spectral_values
                else:
                    for j in range(6):
                        weighted_spectral_values[j] = exponential_weighted_average(
                            weighted_spectral_values[j], spectral_values[j], ALPHA)
                
                weighted_alcohol_value = exponential_weighted_average(
                    weighted_alcohol_value, alcohol_value, ALPHA)
                
                readings_taken += 1
                
                # Wait for next reading interval if not the last reading
                if i < NUM_READINGS - 1:
                    time.sleep(READING_INTERVAL)
            
            # Output the weighted average values if all readings were completed
            if readings_taken == NUM_READINGS:
                print("Sample measured successfully. Remove sample.")
                curr_time=time.ctime(time.time())
                print("{sensor_type}:{ch0},{ch1},{ch2},{ch3},{ch4},{ch5},{alcohol}".format(
                    sensor_type=sensor_type, 
                    ch0=weighted_spectral_values[0],
                    ch1=weighted_spectral_values[1], 
                    ch2=weighted_spectral_values[2],
                    ch3=weighted_spectral_values[3], 
                    ch4=weighted_spectral_values[4],
                    ch5=weighted_spectral_values[5],
                    alcohol=weighted_alcohol_value))
                with open("output.txt","a") as file:
                    file.write(f"At time {curr_time}\n")
                    file.write("{sensor_type}:{ch0},{ch1},{ch2},{ch3},{ch4},{ch5},{alcohol}\n".format(
                            sensor_type=sensor_type, 
                            ch0=weighted_spectral_values[0],
                            ch1=weighted_spectral_values[1], 
                            ch2=weighted_spectral_values[2],
                            ch3=weighted_spectral_values[3], 
                            ch4=weighted_spectral_values[4],
                            ch5=weighted_spectral_values[5],
                            alcohol=weighted_alcohol_value)
                           )
                with open("data.csv","a") as file:
                    file.write("{timestamp},{sensor_type},{ch0},{ch1},{ch2},{ch3},{ch4},{ch5},{alcohol}\n".format(
                            timestamp=curr_time,
                            sensor_type=sensor_type, 
                            ch0=weighted_spectral_values[0],
                            ch1=weighted_spectral_values[1], 
                            ch2=weighted_spectral_values[2],
                            ch3=weighted_spectral_values[3], 
                            ch4=weighted_spectral_values[4],
                            ch5=weighted_spectral_values[5],
                            alcohol=weighted_alcohol_value)
                           )
            elif readings_taken > 0:
                print(f"ERROR: Only {readings_taken} out of {NUM_READINGS} readings completed")
            
            trigger_active = False
            print("Waiting for next sample...")
        
        # Update last states
        last_trigger_state = ir_active
        last_door_state = door_state
        
        # Small delay to avoid busy waiting
        time.sleep(0.1)

except KeyboardInterrupt:
    print("Program terminated by user")

finally:
    GPIO.cleanup()

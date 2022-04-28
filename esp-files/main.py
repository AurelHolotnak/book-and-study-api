from mfrc522 import MFRC522
from i2c_lcd import I2cLcd
from machine import Pin
from machine import SoftI2C
from machine import SPI
import time
from umqttsimple import MQTTClient
import ubinascii
import machine
import micropython
import network
import esp
esp.osdebug(None)
import gc
gc.collect()

ssid = "******"
password = "*******"
mqtt_server = "broker.hivemq.com"

station = network.WLAN(network.STA_IF)
client_id = ubinascii.hexlify(machine.unique_id())

topic_sub = "iot/BookAndStudy/Access"
topic_pub = "iot/BookAndStudy/PostCred"
topic_register_sub = "iot/BookAndStudy/RegisterSub"
topic_register_pub = "iot/BookAndStudy/RegisterPub"

station.active(True)
station.connect(ssid, password)
time.sleep(2)

def scan_isic():

    (stat, tag_type) = rdr.request(rdr.REQIDL)
    if stat == rdr.OK:
        (stat, raw_uid) = rdr.anticoll()
        if stat == rdr.OK:
            lcd.clear()
            lcd.move_to(0, 0)
            lcd.putstr("RFID: ")

            card_id = "0x%02x%02x%02x%02x" %(raw_uid[0], raw_uid[1], raw_uid[2], raw_uid[3])
            print("UID:", card_id)
            lcd.putstr(card_id)

            try:
              msg = str(card_id) + "/1234"
              client.publish(topic_pub, msg)
              lcd.putstr("Processing...")
              client.wait_msg()
            except OSError as e:
                restart_and_reconnect()

            lcd.move_to(0, 1)

def register_isic():
    while True:
        (stat, tag_type) = rdr.request(rdr.REQIDL)
        if stat == rdr.OK:
            (stat, raw_uid) = rdr.anticoll()
            if stat == rdr.OK:
                lcd.clear()
                lcd.move_to(0, 0)
                lcd.putstr("RFID: ")

                card_id = "0x%02x%02x%02x%02x" %(raw_uid[0], raw_uid[1], raw_uid[2], raw_uid[3])
                print("Register UID:", card_id)
                lcd.putstr(card_id)

                try:
                  msg = str(card_id)
                  client.publish(topic_register_pub, msg)
                  lcd.clear()
                  lcd.move_to(0, 0)
                  lcd.putstr("  Registration")
                  lcd.move_to(0,1)
                  lcd.putstr("   sccessfull!")
                  time.sleep(2)
                  lcd.clear()
                  return
                except OSError as e:
                    restart_and_reconnect()

                lcd.move_to(0, 1)

def sub_cb(topic, msg):
    if topic == b"iot/BookAndStudy/RegisterSub":
        lcd.clear()
        lcd.putstr("Place card")
        lcd.move_to(0, 1)
        lcd.putstr("to register")
        register_isic()
        lcd.putstr("Scan RFID")

    elif topic == b"iot/BookAndStudy/Access":

        lcd.clear()
        if msg == b"true":
            access = True
        else:
            access = False

        if access:
            grn.value(True)
            red.value(False)
            lcd.putstr("    Welcome!")
        else:
            grn.value(False)
            red.value(True)
            lcd.putstr(" Access Denied! ")
        print('ESP received message:  ' + str(msg))
        time.sleep(2)
        red.value(False)
        grn.value(False)

def connect_and_subscribe():
  global client_id, mqtt_server, topic_sub
  client = MQTTClient(client_id, mqtt_server)
  client.set_callback(sub_cb)
  client.connect()
  client.subscribe(topic_sub)
  client.subscribe(topic_register_sub)
  print('Connected to %s MQTT broker, subscribed to %s topic' % (mqtt_server, topic_sub))
  return client

def restart_and_reconnect():

  print('Failed to connect to MQTT broker. Reconnecting...')
  time.sleep(10)
  machine.reset()

i2c = SoftI2C(scl=Pin(22, Pin.OUT, Pin.PULL_UP),
              sda=Pin(21, Pin.OUT, Pin.PULL_UP),
              freq=400000)

DEFAULT_I2C_ADDR = i2c.scan()
print(DEFAULT_I2C_ADDR)
lcd = I2cLcd(i2c, DEFAULT_I2C_ADDR[0], 2, 16)

red = Pin(14, Pin.OUT)
grn = Pin(13, Pin.OUT)

spi = SPI(2, baudrate=2500000, polarity=0, phase=0)
spi.init()
rdr = MFRC522(spi=spi, gpioRst=4, gpioCs=5)

print("Place card")

lcd.clear()
lcd.move_to(0, 0)
lcd.putstr("Scan RFID")

try:
    client = connect_and_subscribe()
except OSError as e:
    restart_and_reconnect()

while True:

    client.check_msg()

    scan_isic()


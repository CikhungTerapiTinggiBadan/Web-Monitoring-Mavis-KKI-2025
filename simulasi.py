# Simulasi ngetes data di firebase (pastiin pake database dummy)

import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
import time
import math
from datetime import datetime

# Ganti Path
CREDENTIAL_PATH = ' ' 

# Ganti URL
DATABASE_URL = ' '

# Titik Pusat (UNY)
CENTER_LAT = -7.7701
CENTER_LON = 110.3701

# Pengaturan gerakan muter
RADIUS = 0.0005       
SPEED_DELAY = 0.2    
ANGLE_STEP = 2        

if not firebase_admin._apps:
    cred = credentials.Certificate(CREDENTIAL_PATH)
    firebase_admin.initialize_app(cred, {
        'databaseURL': DATABASE_URL
    })

print("Simulasi Dimulai...")

def upload_static_waypoints():
    print("Mempersiapkan Waypoint Statis...")
    waypoints = {
        "1": {"lat": CENTER_LAT + RADIUS, "long": CENTER_LON + RADIUS},
        "2": {"lat": CENTER_LAT - RADIUS, "long": CENTER_LON + RADIUS},
        "3": {"lat": CENTER_LAT - RADIUS, "long": CENTER_LON - RADIUS},
        "4": {"lat": CENTER_LAT + RADIUS, "long": CENTER_LON - RADIUS}
    }
    
    ref = db.reference('Data/Waypoint')
    ref.set(waypoints)
    print("Waypoint berhasil diupload (Cek garis putus-putus di Web).")

def main_loop():
    angle = 0
    checkpoint_idx = 1
    last_checkpoint_time = time.time() 
    try:
        upload_static_waypoints()
        
        print("Mulai bergerak melingkar...")
        
        while True:
            rad = math.radians(angle)
            
            current_lat = CENTER_LAT + (RADIUS * math.cos(rad))
            current_lon = CENTER_LON + (RADIUS * math.sin(rad)) / math.cos(math.radians(CENTER_LAT))
            
            heading = (angle + 180) % 360
            
            now = datetime.now()
            date_str = now.strftime("%d/%m/%Y")
            day_str = now.strftime("%A")
            time_str = now.strftime("%H:%M:%S")

            db.reference('Data/GPS_DATA').update({
                'latitude': current_lat,
                'longitude': current_lon,
                'COG': heading
            })

            db.reference('Data/Speed Over Ground').update({
                'Heading': heading,
                'SOG_KMH': 10.5,     
                'SOG_KNOT': 5.6
            })

            db.reference('Data/Centerpoint Garis').update({
                'Date': date_str,
                'Day': day_str,
                'Time': time_str
            })

            if time.time() - last_checkpoint_time >= 10:
                print(f"Mencatat Checkpoint #{checkpoint_idx}...")
                
                checkpoint_data = {
                    "lat": current_lat,
                    "long": current_lon,
                    "heading": heading,
                    "cog": heading,
                    "speed": 10.5, 
                    "Date": date_str,
                    "Day": day_str,
                    "Time": time_str
                }
                
                db.reference(f'Data/Checkpoint/{checkpoint_idx}').set(checkpoint_data)
                
                checkpoint_idx += 1
                last_checkpoint_time = time.time()

            angle -= ANGLE_STEP
            if angle < 0: angle = 360
            
            time.sleep(SPEED_DELAY)

    except KeyboardInterrupt:
        print("\nSimulasi berhenti.")

if __name__ == "__main__":
    main_loop()
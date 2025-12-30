# 🚤 Mavis Sengkuni - Vehicle Monitoring Dashboard

Mavis Sengkuni is a web-based Vehicle Monitoring System (VMS) application developed by the **Mavis Team from Yogyakarta State University (UNY)**. This application is designed to monitor the movement and status of the "Sengkuni" ASV (Autonomous Surface Vehicle) in real-time using Firebase database integration.

![Dashboard Screenshot](public/main.png)

## Key Features

* **Real-Time Telemetry Data:** Direct integration with Firebase Realtime Database to instantly display GPS coordinates, *Course Over Ground* (COG), and speed (KMH/Knot).
* **Interactive Map (MapLibre):** Visualization of the vehicle's position on a map featuring:
    * **Trajectory Tracking:** A red line indicating the history of the path traveled.
    * **Heading & COG:** Indicators for the vehicle's heading and projected direction of motion (yellow line).
    * **Dynamic Grid:** A dynamic grid on the map to assist in estimating distances between points.
* **Checkpoint Monitoring System:** An automated log table that records the time, coordinates, and speed every time the vehicle passes a checkpoint (1-13).
* **Dual-Camera Capture:** Displays the latest image captures from two cameras (Surface & Underwater) in Base64 format.
* **Track Selector:** A feature to select the track mode (A or B) which adjusts the navigation orientation on the dashboard.
* **Livestream:** Embedded YouTube livestream video showing the real-time POV from the vehicle.

## Tech Stack

* **Framework:** Next.js (React)
* **Styling:** Tailwind CSS
* **Database:** Firebase Realtime Database
* **Mapping:** MapLibre GL & React Map GL
* **Components:** * `react-wavify` (Header wave animation)
    * `lucide-react` / Heroicons (Iconography)

## Firebase Data Structure

The application expects the following data structure on Firebase:
* `Data/GPS_DATA`: Latitude, Longitude, COG.
* `Data/Speed Over Ground`: SOG_KMH, SOG_KNOT, Heading.
* `Data/Centerpoint Garis`: Base64 Images (Surface & Underwater), Date, Time.
* `Data/Checkpoint`: History data for each post.

## Local Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/username/mavis-sengkuni.git](https://github.com/username/mavis-sengkuni.git)
    cd mavis-sengkuni
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Firebase Configuration:**
    Ensure the `firebaseConfig.js` file is configured with your project API Key. Use `.env.local` if possible.

4.  **Run the application:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

![Dashboard Screenshot](public/main2.png)

---
# 🖥️ Database Control Center - Firebase Data Management Dashboard

The Database Control Center functions to add, delete, and edit data in Firebase to adjust the data conditions to be displayed in the monitoring system before the competition begins.

![Dashboard Screenshot](public/db.png)

## Key Features

* **Reset Database:** A feature to clear dynamic database values such as checkpoint times, as well as surface and underwater captures before starting a new mission.
* **Mission Planner:** Automatically upload track coordinates (Track A or B) to Firebase.
* **Data Export:** Download checkpoint history logs and telemetry data in JSON or Excel (.xlsx) format for post-mission competition analysis.
* **Simulation Monitoring:** Run a Python script that simulates the vehicle's movement.

## Tech Stack

* **Framework:** Streamlit
* **Database:** Firebase Realtime Database
* **Components:** * `pandas`
    * `Openpyxl`

## Local Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/username/mavis-sengkuni.git](https://github.com/username/mavis-sengkuni.git)
    cd mavis-sengkuni
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r py_requirements.txt
    ```

3.  **Firebase Configuration Preparation:**
    Ensure the `serviceAccountKey.json` file has been downloaded and the database URL has been copied.

4.  **Run the application:**
    ```bash
    streamlit run crud.py
    ```
    The application will be available at `http://localhost:8501/`.

5.  **Firebase Configuration:**
    Select the `serviceAccountKey.json` file and enter the database URL as directed.

6.  **Running the Simulation:**
    In another terminal, run:
    ```bash
    python simulasi.py
    ```
---
**Mavis Team - Yogyakarta State University**

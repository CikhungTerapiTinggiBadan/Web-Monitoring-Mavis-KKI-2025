import streamlit as st
import firebase_admin
from firebase_admin import credentials, db
import json
import pandas as pd
from datetime import datetime
import io

# DATA DUMMY LINTASAN (Ubah sesuai koor) A DAN B

LINTASAN_A = {
    "1": {"lat": -7.91538660, "long": 112.58920460},
    "2": {"lat": -7.91539490, "long": 112.58918950},
    "3": {"lat": -7.91540100, "long": 112.58915190},
    "4": {"lat": -7.91549420, "long": 112.58912290},
    "5": {"lat": -7.91550840, "long": 112.58912970},
    "6": {"lat": -7.91552410, "long": 112.58913590},
    "7": {"lat": -7.91554310, "long": 112.58914140},
    "8": {"lat": -7.91557220, "long": 112.58919510},
    "9": {"lat": -7.91556360, "long": 112.58922670},
    "10": {"lat": -7.91555300, "long": 112.58925800},
    "11": {"lat": -7.91552180, "long": 112.58929760},
    "12": {"lat": -7.91550320, "long": 112.58929400},
    "13": {"lat": -7.91539650, "long": 112.58928420}
}

LINTASAN_B = {
    "1": {"lat": -7.91511170, "long": 112.58896620},
    "2": {"lat": -7.91511370, "long": 112.58895170},
    "3": {"lat": -7.91513410, "long": 112.58892170},
    "4": {"lat": -7.91508740, "long": 112.58882930},
    "5": {"lat": -7.91506870, "long": 112.58882200},
    "6": {"lat": -7.91505320, "long": 112.58881450},
    "7": {"lat": -7.91503800, "long": 112.58880630},
    "8": {"lat": -7.91497030, "long": 112.58881460},
    "9": {"lat": -7.91495350, "long": 112.58884310},
    "10": {"lat": -7.91494140, "long": 112.58887620},
    "11": {"lat": -7.91493920, "long": 112.58895410},
    "12": {"lat": -7.91494050, "long": 112.58896690},
    "13": {"lat": -7.91502440, "long": 112.58898160}
}
ROOT_NODE = 'Data' 

st.set_page_config(page_title="Firebase Admin Panel", layout="wide")
st.title("🚀 ASV Sigma Sigma Boy UNY - Database Control Center")

# KONEKSI DISINI (DOWNLOAD DULU SERVICEKEY di FIREBASE/ Database)

st.sidebar.header("🔌 Koneksi Database")
key_file = st.sidebar.file_uploader("Upload Service Account", type=['json'])
db_url = st.sidebar.text_input("Database URL", value=" ") # Masukkin link database

if key_file and db_url:
    try:
        if not firebase_admin._apps:
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as fp:
                fp.write(key_file.getvalue())
                temp_path = fp.name
            
            cred = credentials.Certificate(temp_path)
            firebase_admin.initialize_app(cred, {'databaseURL': db_url})
            st.sidebar.success("Firebase Terhubung!")
        else:
            st.sidebar.info("Sudah Terhubung.")
    except Exception as e:
        st.sidebar.error(f"Error Koneksi: {e}")
else:
    st.sidebar.warning("Silakan upload key JSON dan masukkan URL Database.")
    st.stop()


def get_all_data():
    ref = db.reference(ROOT_NODE)
    return ref.get()

def reset_database_values(keep_waypoints=True):
    ref = db.reference(ROOT_NODE)
    # Ubah kaya yang di utama
    empty_structure = {
        "GPS_DATA": {"latitude": -7.91538660, "longitude": 112.58920460, "COG": 0},
        "Speed Over Ground": {"Heading": 0, "SOG_KMH": 0, "SOG_KNOT": 0},
        "Centerpoint Garis": {"Date": "-", "Day": "-", "Time": "-", "imageBase64": "", "underwaterImageBase64": ""},
        "Checkpoint": {"0": "Start"}
    }
    ref.update(empty_structure)
    if not keep_waypoints:
        ref.child("Waypoint").set({})
    return True

def upload_waypoint_data(waypoint_dict):
    """Mengirim data lintasan ke node Waypoint"""
    try:
        ref = db.reference(f"{ROOT_NODE}/Waypoint")
        ref.set(waypoint_dict)
        return True
    except Exception as e:
        return str(e)

def convert_to_excel(data):
    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='openpyxl')
    
    summary_data = []
    if data:
        if 'GPS_DATA' in data:
            for k, v in data['GPS_DATA'].items():
                summary_data.append({'Category': 'GPS', 'Key': k, 'Value': v})
        if 'Speed Over Ground' in data:
            for k, v in data['Speed Over Ground'].items():
                summary_data.append({'Category': 'Speed', 'Key': k, 'Value': v})
        if 'Centerpoint Garis' in data:
             for k, v in data['Centerpoint Garis'].items():
                if "Base64" not in k:
                    summary_data.append({'Category': 'Time/Info', 'Key': k, 'Value': v})
    
    df_summary = pd.DataFrame(summary_data)
    df_summary.to_excel(writer, sheet_name='Current Status', index=False)
    
    checkpoint_list = []
    if data and 'Checkpoint' in data:
        cp_data = data['Checkpoint']
        if isinstance(cp_data, list):
            for i, item in enumerate(cp_data):
                if item: 
                    item['ID'] = i
                    checkpoint_list.append(item)
        elif isinstance(cp_data, dict):
            for k, v in cp_data.items():
                if isinstance(v, dict):
                    v['ID'] = k
                    checkpoint_list.append(v)
    
    if checkpoint_list:
        df_cp = pd.DataFrame(checkpoint_list)
        cols = ['ID'] + [c for c in df_cp.columns if c != 'ID']
        df_cp = df_cp[cols]
        df_cp.to_excel(writer, sheet_name='Log Checkpoints', index=False)
        
    writer.close()
    return output.getvalue()

tab1, tab2, tab4, tab3 = st.tabs(["📊 Monitoring", "⚠️ Control & Reset", "🗺️ Upload Lintasan", "📂 Logs & Export"])

with tab1:
    st.subheader("Realtime Data View")
    if st.button("Refresh Data", key="refresh_mon"):
        st.rerun()
    data = get_all_data()
    if data:
        col1, col2, col3 = st.columns(3)
        with col1:
            st.info("📍 GPS DATA")
            st.write(data.get("GPS_DATA", "No Data"))
        with col2:
            st.success("🚤 SPEED & HEADING")
            st.write(data.get("Speed Over Ground", "No Data"))
        with col3:
            st.warning("⏱️ TIME & INFO")
            info = data.get("Centerpoint Garis", {}).copy()
            if 'imageBase64' in info: info['imageBase64'] = "HIDDEN"
            if 'underwaterImageBase64' in info: info['underwaterImageBase64'] = "HIDDEN"
            st.write(info)
        st.divider()
        st.subheader("🚩 Checkpoints & Waypoints")
        c1, c2 = st.columns(2)
        with c1:
            st.write("Checkpoint (History):")
            st.json(data.get("Checkpoint", {}), expanded=False)
        with c2:
            st.write("Waypoint (Target):")
            st.json(data.get("Waypoint", {}), expanded=False)
    else:
        st.warning("Database Kosong")

# RESET FUNCTION
with tab2:
    st.subheader("⚠️ Zona Bahaya")
    st.error("### KOSONGKAN NILAI DATABASE (RESET)")
    keep_wp = st.checkbox("Pertahankan Data Waypoint?", value=True)
    if st.button("🔥 RESET SEMUA VALUE"):
        try:
            success = reset_database_values(keep_waypoints=keep_wp)
            if success:
                st.toast("Database berhasil di-reset!", icon="✅")
                st.success("Database Reset Selesai.")
        except Exception as e:
            st.error(f"Gagal: {e}")

with tab4:
    st.subheader("🗺️ Atur Misi Lintasan")
    st.write("Pilih lintasan yang ingin digunakan. Data akan langsung dikirim ke `Data/Waypoint` di Firebase.")
    
    col_sel, col_prev = st.columns([1, 2])
    
    with col_sel:
        pilihan = st.radio("Pilih Lintasan:", ["Lintasan A", "Lintasan B"])
        
        if pilihan == "Lintasan A":
            data_to_send = LINTASAN_A
            desc = "Lintasan A (13 Titik)"
        else:
            data_to_send = LINTASAN_B
            desc = "Lintasan B (13 Titik)"
            
        st.info(f"Anda memilih: **{desc}**")
        
        if st.button(f"🚀 KIRIM {pilihan.upper()} KE DATABASE", type="primary"):
            with st.spinner("Mengirim data..."):
                result = upload_waypoint_data(data_to_send)
                if result is True:
                    st.success(f"Berhasil! {pilihan} telah aktif di database.")
                    st.toast("Waypoint Terupdate!", icon="🎯")
                else:
                    st.error(f"Gagal mengirim: {result}")
    
    with col_prev:
        st.write("Preview Data Koordinat:")
        df_preview = pd.DataFrame.from_dict(data_to_send, orient='index')
        st.dataframe(df_preview, use_container_width=True)

with tab3:
    st.subheader("📂 Download Log Data")
    current_data = get_all_data()
    if current_data:
        colA, colB = st.columns(2)
        with colA:
            json_str = json.dumps(current_data, indent=4)
            timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            st.download_button("Download JSON", json_str, f"log_{timestamp}.json", "application/json")
        with colB:
            try:
                excel_data = convert_to_excel(current_data)
                st.download_button("Download Excel", excel_data, f"log_{timestamp}.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            except Exception as e:
                st.error(f"Excel Error: {e}")
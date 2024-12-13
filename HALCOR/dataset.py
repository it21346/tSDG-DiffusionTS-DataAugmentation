import pandas as pd
import matplotlib.pyplot as plt
import os, datetime
import glob
import numpy as np


def xlsx_to_dataframe(filename):
    df = pd.read_excel(filename, sheet_name=None)
    df = pd.concat(df.values(), ignore_index=True)
    return df

def xlsx_to_dataframe_specific(filenames, x1='01.A.PLC.Raw', x2='01.B.MES.Raw'):
    # filenames is the list containing the xlsx files, here is the 05/06/07 months
    df1 = pd.read_excel(filenames[0], sheet_name=x1)
    df2 = pd.read_excel(filenames[0], sheet_name=x2)
    df3 = pd.read_excel(filenames[1], sheet_name=x1)
    df4 = pd.read_excel(filenames[1], sheet_name=x2)
    df5 = pd.read_excel(filenames[2], sheet_name=x1)
    df6 = pd.read_excel(filenames[2], sheet_name=x2)

    df_plc = pd.concat([df1, df3, df5], ignore_index=True)
    df_mes = pd.concat([df2, df4, df6], ignore_index=True)
    columns_to_keep_plc = ['Calendar (Production) date', 'Product Group', 'SKU code', 'Event Code',
       'Production Quantity (#) ', 'Duration (sec)', 'Start time', 'End time',
       'PLC Production Date', 'Καθαρές Μηχανοώρες (min)']
    
    columns_to_keep_mes = ['Work Center', 'Start Time', 'End Time', 'Περιγραφή υλικού',
       'Event Code', 'Duration (min)', 'Production Quantity (#)']

    df_plc = df_plc.filter(items=columns_to_keep_plc)
    df_mes = df_mes.filter(items=columns_to_keep_mes)
    return df_plc, df_mes


def load_all_csv_PLC():
    csv_list = []
    dir_path = "/home/stelios-pc/Desktop/PhD/HALCOR/Data/Data_PLC_Analyzer"
    # Use glob to get all the CSV files in the main directory and its subdirectories
    all_files = glob.glob(os.path.join(dir_path, '**', '*.csv'), recursive=True)
    for file in all_files:
        df = pd.read_csv(file, sep=';', encoding='utf-8')
        csv_list.append(df)

    plc_anal_df = pd.concat(csv_list, ignore_index=True)
    return plc_anal_df

class Dataset:
    def __init__(self, resample_flag):
        self.resample_flag = resample_flag
        self.energy_data = None
        self.data = None

        # Pre-processing
        df_plc, df_mes= xlsx_to_dataframe_specific(["/home/stelios-pc/Desktop/PhD/HALCOR/Data/Exports_BEST/Monthly Loss Tree 05.2022 (Weeks 18, 19, 20, 21).xlsm", "/home/stelios-pc/Desktop/PhD/HALCOR/Data/Exports_BEST/Loss Tree_Month 6.2022_v11.8.xlsm", "/home/stelios-pc/Desktop/PhD/HALCOR/Data/Exports_BEST/Loss Tree_Month 7.2022_v12.2 (Weeks 27, 28, 29, 30).xlsm"])
        df_plc= df_plc.drop_duplicates().dropna()
        df_plc = df_plc[:-1]
        df_mes = df_mes.drop_duplicates().dropna()
        df_plc.to_csv("/home/stelios-pc/Desktop/PhD/HALCOR/Data/Exports_BEST/PLC_RAW.csv", sep=';', encoding='utf-8')
        df_mes.to_csv("/home/stelios-pc/Desktop/PhD/HALCOR/Data/Exports_BEST/MES_RAW.csv", sep=';', encoding='utf-8')
        # Concatenate all energies together for each timestamp
        total_energy = None
        for filename in os.listdir("/home/stelios-pc/Desktop/PhD/HALCOR/Data/Data_Energy_Consumptions"):
            f = os.path.join("/home/stelios-pc/Desktop/PhD/HALCOR/Data/Data_Energy_Consumptions", filename)
            df = xlsx_to_dataframe(f)
            df.drop(columns="Reactive Energy Into the Load", inplace=True)
            df['Real Energy'] = pd.to_numeric(df['Real Energy'], downcast='float', errors='coerce')
            df = df.sort_values(by='Timestamp', ascending= True)
            # the '-' rows should be filled with the previous value instead (the previous 15-minute)
            df = df.applymap(lambda x : np.nan if x == '-' else x) # convert - into nan so I can do fillna later
            df['Real Energy'] = df['Real Energy'].interpolate()
            if total_energy is None:
                total_energy = df
            else:
                total_energy = pd.concat([df, total_energy], ignore_index=True)
                total_energy = total_energy.groupby('Timestamp').sum().reset_index()

        total_energy['Timestamp'] = total_energy['Timestamp'].dt.floor('min')
        total_energy['Timestamp'] = pd.to_datetime(total_energy['Timestamp'])
        #outliers
        total_energy = total_energy[total_energy['Timestamp'] != '2022-07-01 07:15:00']
        total_energy = total_energy[total_energy['Timestamp'] != '2022-06-01 07:15:00']
        #outliers
        
        self.energy_data = total_energy

        self.energy_data.set_index('Timestamp', inplace=True)
        self.energy_data = self.energy_data.resample('15min', closed='right', label='right').sum()
        self.energy_data.replace(0, np.nan, inplace=True)
        self.energy_data = self.energy_data.interpolate()
        self.energy_data.reset_index(inplace=True)
        self.energy_data['diff'] = self.energy_data['Real Energy'].diff()

        self.energy_data['Timestamp'] = pd.to_datetime(self.energy_data['Timestamp'])
        start_time = pd.Timestamp('2022-05-31 07:00:00')
        end_time = pd.Timestamp('2022-06-01 07:30:00')
        self.energy_data = self.energy_data[~((self.energy_data['Timestamp'] >= start_time) & (self.energy_data['Timestamp'] <= end_time))]
        start_time = pd.Timestamp('2022-06-30 07:15:00')
        end_time = pd.Timestamp('2022-07-01 07:45:00')
        self.energy_data = self.energy_data[~((self.energy_data['Timestamp'] >= start_time) & (self.energy_data['Timestamp'] <= end_time))]
        self.data = self.energy_data
    # change the interval of the data, for example from 15-min intervals, to 1 hour...etc.
    def preprocess(self):
        """
        For base case, just return the 15-min intervals.
        Otherwise, some resample_flag options are:
        '1h' -> 1-hour interval
        '4h' -> 4-hour interval
        '1d' -> 1-day interval
        '1w' -> 1-week interval. This might need a little change in the code, specifically this line timeWindows.insert(0, pd.to_datetime('2022-05-01 00:00:00', format='%Y-%m-%d %H:%M:%S'))
        """
        
        self.energy_data.set_index('Timestamp', inplace=True)
        self.energy_data = self.energy_data.resample(self.resample_flag, closed='right', label='right').sum()
        self.energy_data.replace(0, np.nan, inplace=True)
        # self.energy_data = self.energy_data.interpolate()
        self.energy_data.reset_index(inplace=True)
        # self.energy_data['diff'] = self.energy_data['Real Energy'].diff()


        plcBestframe = pd.read_csv("/home/stelios-pc/Desktop/PhD/HALCOR/Data/Exports_BEST/PLC_RAW.csv",delimiter=';').drop_duplicates().dropna()
        plcBestframe['Timestamp'] = plcBestframe[['Calendar (Production) date','End time']].T.agg(lambda x: (x.values[0]+' '+x.values[1]))
        plcBestframe['Timestamp'] = pd.to_datetime(plcBestframe['Timestamp'], format='%Y-%m-%d %H:%M:%S')
        plcBestframe = plcBestframe.drop(columns=['Calendar (Production) date','End time','Start time','PLC Production Date'])
        plcBestframe.drop("Unnamed: 0", axis= 1)
        timeWindows = self.energy_data['Timestamp'].tolist()
        labels = self.energy_data['Timestamp'].tolist()
        if self.resample_flag == '1w':
            labels = labels[1:]
        else:
            timeWindows.insert(0, pd.to_datetime('2022-05-01 00:00:00', format='%Y-%m-%d %H:%M:%S'))
        plcBestframe['Time Bin'] = pd.cut(plcBestframe['Timestamp'], timeWindows, labels=labels, right=False)
        plcBestframe.drop("Unnamed: 0", axis= 1, inplace=True)

        plcBestframe['Product Group'] = plcBestframe['Product Group'].astype('str')
        plcBestframe['SKU code'] = plcBestframe['SKU code'].astype('str')
        plcBestframe['Event Code'] = plcBestframe['Event Code'].astype('str')
        plcBestframe = plcBestframe.groupby('Time Bin', sort=True).agg({'Product Group':set,'SKU code':set,'Event Code':set,'Production Quantity (#) ':sum,'Duration (sec)':sum,'Καθαρές Μηχανοώρες (min)':sum}).reset_index()
        
        mesBestframe = pd.read_csv("/home/stelios-pc/Desktop/PhD/HALCOR/Data/Exports_BEST/MES_RAW.csv",delimiter=';').drop_duplicates().dropna()
        timeWindows = self.energy_data['Timestamp'].tolist()
        labels = self.energy_data['Timestamp'].tolist()
        if self.resample_flag == '1w':
            labels = labels[1:]
        else:
            timeWindows.insert(0, pd.to_datetime('2022-05-01 00:00:00', format='%Y-%m-%d %H:%M:%S'))
        mesBestframe['Time Bin'] = pd.cut(mesBestframe['End Time'], timeWindows, labels=labels, right=False)
        mesBestframe.drop("Unnamed: 0", axis= 1, inplace=True)
        mesBestframe = mesBestframe[:-1]

        mesBestframe['Περιγραφή υλικού'] = mesBestframe['Περιγραφή υλικού'].astype('str')
        mesBestframe['Work Center'] = mesBestframe['Work Center'].astype('str')
        mesBestframe['Event Code'] = mesBestframe['Event Code'].astype('str')
        mesBestframe = mesBestframe.groupby('Time Bin', sort=True).agg({'Περιγραφή υλικού':set,'Work Center':set,'Event Code':set,'Production Quantity (#)':sum,'Duration (min)':sum}).reset_index()


        #Merge MES and PLC dataframes
        bestFrame = plcBestframe.join(mesBestframe.set_index('Time Bin'), on='Time Bin', lsuffix='_plc',rsuffix='_mes')
        bestFrame.rename(columns={'Production Quantity (#) ': 'products_plc', 'Production Quantity (#)':'products_mes'}, inplace=True)
        bestFrame['Production Quantity (#)'] = bestFrame['products_plc'] + bestFrame['products_mes']

        # # Define the specific combination to match
        # target_row = {
        #     'Product Group': set,
        #     'SKU code': set,
        #     'Event Code_plc': set,
        #     'products_plc': 0.0,
        #     'Duration (sec)': 0.0,
        #     'Καθαρές Μηχανοώρες (min)': 0.0,
        #     'Περιγραφή υλικού': set,
        #     'Work Center': set,
        #     'Event Code_mes': set,
        #     'products_mes': 0.0,
        #     'Duration (min)': 0.0,
        #     'Production Quantity (#)': 0.0
        # }
        # # Create a boolean mask to identify rows that match the combination
        # mask = (
        #     (bestFrame['Product Group'] == target_row['Product Group']) &
        #     (bestFrame['SKU code'] == target_row['SKU code']) &
        #     (bestFrame['Event Code_plc'] == target_row['Event Code_plc']) &
        #     (bestFrame['products_plc'] == target_row['products_plc']) &
        #     (bestFrame['Duration (sec)'] == target_row['Duration (sec)']) &
        #     (bestFrame['Καθαρές Μηχανοώρες (min)'] == target_row['Καθαρές Μηχανοώρες (min)']) &
        #     (bestFrame['Περιγραφή υλικού'] == target_row['Περιγραφή υλικού']) &
        #     (bestFrame['Work Center'] == target_row['Work Center']) &
        #     (bestFrame['Event Code_mes'] == target_row['Event Code_mes']) &
        #     (bestFrame['products_mes'] == target_row['products_mes']) &
        #     (bestFrame['Duration (min)'] == target_row['Duration (min)']) &
        #     (bestFrame['Production Quantity (#)'] == target_row['Production Quantity (#)'])
        # )
        # bestFrame = bestFrame[~mask]
        
        bestFrame['Time Bin'] = pd.to_datetime(bestFrame['Time Bin'], errors='raise')
        self.energy_data.set_index('Timestamp', inplace=True)
        bestFrame.set_index('Time Bin', inplace=True)
        self.energy_data = self.energy_data.join(bestFrame, lsuffix='out_', rsuffix='in_')
        self.energy_data.reset_index(inplace=True)


        plc_anal_df = load_all_csv_PLC()
        plc_anal_df.drop(columns = ['DB  802DBX    2.6   fault  pressure', 'DB  802DBX    2.5    fault flow', 'I    265.0', 'I    265.1'], inplace = True)
        plc_anal_df['Timestamp'] = plc_anal_df[['Datum','Absolutzeit']].T.agg(lambda x: (x.values[0]+' '+x.values[1]))
        plc_anal_df['Timestamp'] = pd.to_datetime(plc_anal_df['Timestamp'], format='%d.%m.%Y %H:%M:%S.%f').dt.strftime('%Y-%m-%d %H:%M:%S')
        plc_anal_df['Timestamp'] = pd.to_datetime(plc_anal_df['Timestamp'], format='%Y-%m-%d %H:%M:%S')
        plc_anal_df.drop(columns = ['Datum', 'Absolutzeit', 'Relativzeit'], inplace=True)
        #replace 2021 to 2022 in timestamps
        plc_anal_df['Timestamp'] = plc_anal_df['Timestamp'].apply(lambda x: x.replace(year=2022) if x.year == 2021 else x)
        #create time bins
        timeWindows = self.energy_data['Timestamp'].tolist()
        labels = self.energy_data['Timestamp'].tolist()
        if self.resample_flag == '1w':
            labels = labels[1:]
        else:
            timeWindows.insert(0, pd.to_datetime('2022-05-01 00:00:00', format='%Y-%m-%d %H:%M:%S'))
        plc_anal_df['Time Bin'] = pd.cut(plc_anal_df['Timestamp'], timeWindows, labels=labels, right=False)
        plc_anal_df = plc_anal_df.groupby('Time Bin').mean().reset_index()
        plc_anal_df.drop(columns = ['Timestamp','Trigger','Fehler'], inplace=True)

        self.energy_data.set_index('Timestamp', inplace=True)
        plc_anal_df.set_index('Time Bin', inplace=True)
        self.energy_data = self.energy_data.join(plc_anal_df, lsuffix='out_', rsuffix='in_')
        self.energy_data.reset_index(inplace=True)
        self.energy_data.drop(columns = ['products_plc','products_mes', 'Περιγραφή υλικού'], inplace=True)
        self.energy_data = self.energy_data.applymap(lambda x : np.nan if not x else x) # convert empty sets into nan so i can do fillna later

        # forward fill seems appropriate for this kind of data to fill the NaN values, since we want to maintain the temporal consistency
        self.energy_data = self.energy_data.fillna(method='ffill').fillna(method='bfill')

        #save to csv
        self.energy_data.to_csv('/home/stelios-pc/Desktop/PhD/HALCOR/Data/data.csv', encoding="utf-8")

        return self.energy_data
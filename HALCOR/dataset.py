import pandas as pd
import matplotlib.pyplot as plt
import os, datetime
import glob
import numpy as np

def xlsx_to_dataframe(filename):
    """
    Function to read an excel file and convert it to a pandas dataframe.

    Args:
        filename (string) : File path of the xlsx file.

    Returns:
        pd.dataframe: Returns a pandas dataframe.
    """

    df = pd.read_excel(filename, sheet_name=None)
    df = pd.concat(df.values(), ignore_index=True)
    return df

def xlsx_to_dataframe_specific(filenames, x1='NAME OF PLC SHEET', x2='NAME OF MES SHEET'):
    """
    Function to retrieve from multiple excel files with multiple sheets, 
    the PLC and MES sheets and convert them into a pandas dataframe.

    Args:
        filenames (list(string)) : List of file paths of the xlsx files.
        x1 (string) : The name of the PLC sheet inside the xlsx files.
        x2 (string) : The name of the Manufacturing Execution System (MES) sheet inside the xlsx files.
        
    Returns:
        pd.dataframe, pd.dataframe : Returns two pandas dataframes. PLC and MES.
    """
    df_plc_list = []
    df_mes_list = []
    for i in range(len(filenames)):
        df_plc_list.append(pd.read_excel(i, sheet_name=x1))
        df_mes_list.append(pd.read_excel(i, sheet_name=x2))

    df_plc = pd.concat(df_plc_list, ignore_index=True)
    df_mes = pd.concat(df_mes_list, ignore_index=True)
    
    # Preprocessing step if you want to keep only a specific amount of columns from these newly created df_plc and df_mes
    columns_to_keep_plc = ['List of columns names you want to keep for PLC']
    columns_to_keep_mes = ['List of columns names you want to keep for MES']

    df_plc = df_plc.filter(items=columns_to_keep_plc)
    df_mes = df_mes.filter(items=columns_to_keep_mes)
    return df_plc, df_mes

def unify_csv(path, name):
    """
    Function to unify csv files from a folder path. In this example, it also combines some time columns.

    Returns:
        pd.dataframe : Returns a pandas dataframe.
    """
    all_files = glob.glob(path + "*.csv")
    if name not in["exodos", "junker2"]: # the exodos folder seem to contain weird symbols for some column names, thus latin-1 encoding is needed
        dfs = [pd.read_csv(file, sep=';') for file in all_files]
    else:
        dfs = [pd.read_csv(file, sep=';', encoding='latin-1') for file in all_files]
    combined_df = pd.concat(dfs, join = 'outer', ignore_index=True)
    # Combine 'Datum' and 'Absolutezeit' into a single datetime column
    combined_df['Timestamp'] = pd.to_datetime(combined_df['Datum'] + ' ' + combined_df['Absolutzeit'],  dayfirst=True)
    # Sort the concatenated DataFrame by the new 'Timestamp' column
    sorted_df = combined_df.sort_values(by='Timestamp')
    # # Save the result to a new CSV if needed
    # sorted_df.to_csv(name + ".csv", sep = ';', index=True)
    return sorted_df

def load_all_csv_PLC():
    """
    Function to load all the csv files related to PLC sensor data

    Returns:
        pd.dataframe : Returns a pandas dataframe.
    """
    csv_list = []
    dir_path = "PATH TO DATA_PLC_ANALYZER"
    # Use glob to get all the CSV files in the main directory and its subdirectories
    all_files = glob.glob(os.path.join(dir_path, '**', '*.csv'), recursive=True)
    for file in all_files:
        df = pd.read_csv(file, sep=';', encoding='utf-8')
        csv_list.append(df)

    plc_anal_df = pd.concat(csv_list, ignore_index=True)
    return plc_anal_df


class Dataset:
    """
    Class for creating and preprocessing a dataset.
    
    Args:
        resample_flag (string) : This parameter decides the data granularity (interval) the data will have. 

    Returns:
        pd.dataframe : Returns a pandas dataframe.
    """
    def __init__(self, resample_flag):
        self.resample_flag = resample_flag
        self.energy_data = None
        self.data = None

        # # Pre-processing
        # path_to_list_of_xlsx_files = ''
        # df_plc, df_mes= xlsx_to_dataframe_specific(path_to_list_of_xlsx_files)
        # df_plc= df_plc.drop_duplicates().dropna()
        # df_plc = df_plc[:-1]
        # df_mes = df_mes.drop_duplicates().dropna()
        

        # Concatenate all energies together for each timestamp
        total_energy = None
        # Folder with energy consumption files
        path_to_energy_consumption_files = './Data/PRESS PME DATA FY2024.xlsx'
        excel_data = pd.ExcelFile(path_to_energy_consumption_files)
        start_timestamp = pd.Timestamp('2024-01-01 11:30:00')
        df_energy = []
        # Loop through each sheet
        for sheet_name in excel_data.sheet_names:
            # Read the sheet
            df = excel_data.parse(sheet_name)
            # Keep only the first two columns
            df = df.iloc[:, :2]
            # Make all the sheets start from a specific timestamp for smoothness. Convert the timestamp column to datetime (assume it's the first column)
            df.iloc[:, 0] = pd.to_datetime(df.iloc[:, 0])
            df = df[df.iloc[:, 0] >= start_timestamp]
            df['Real Energy'] = pd.to_numeric(df['Real Energy'], downcast='float', errors='coerce')
            # Adjust timestamps where seconds are not 00
            df['Timestamp'] = df['Timestamp'].apply(lambda x: x.replace(second=0))
            df = df.sort_values(by='Timestamp', ascending= True)
            # Remove duplicates that exist in the dataset, if they exist.
            df.drop_duplicates(subset='Timestamp', keep='last', inplace = True)
            # the '-' rows should be filled with the previous value instead (the previous 15-minute)
            df = df.applymap(lambda x : np.nan if x == '-' else x) # convert - into nan so later can be filled with 'fillna' later
            df.set_index('Timestamp', inplace=True)
            df = df.resample('15min', closed='right', label='right').ffill()
            df.reset_index(inplace=True)
            df['Real Energy'] = df['Real Energy'].interpolate() # interpolate values
            # Append the DataFrame to the list
            df_energy.append(df)

        total_energy = pd.concat(df_energy, ignore_index=True)
        total_energy = total_energy.groupby('Timestamp').sum().reset_index()
        self.energy_data = total_energy
        self.energy_data.set_index('Timestamp', inplace=True)
        # Set the initial granularity to 15 minute intervals for baseline.
        self.energy_data = self.energy_data.resample('15min', closed='right', label='right').ffill()
        # total_energy.replace(0, np.nan, inplace=True)
        # total_energy = total_energy.interpolate()
        self.energy_data.reset_index(inplace=True)

        # Since energy was cumulative, We take the difference and save it into a column
        self.energy_data['diff'] = self.energy_data['Real Energy'].diff()
        self.energy_data['diff'] = self.energy_data['diff'].interpolate()
        self.energy_data['Timestamp'] = pd.to_datetime(self.energy_data['Timestamp'])
        self.energy_data = self.energy_data.iloc[:-1] #DROP LAST ROW
        self.energy_data.drop(columns='Real Energy', inplace = True)
        self.data = self.energy_data

    def preprocess(self):
        """
        For base case, just return the 15-min intervals.
        Otherwise, some resample_flag options are:
        '1h' -> 1-hour interval
        '4h' -> 4-hour interval
        '1d' -> 1-day interval
        '1w' -> 1-week interval.
        """
        # Create the granularity based on the resample_flag
        self.energy_data.set_index('Timestamp', inplace=True)
        self.energy_data = self.energy_data.resample(self.resample_flag, closed='right', label='right').sum()
        self.energy_data.replace(0, np.nan, inplace=True)
        self.energy_data.reset_index(inplace=True)

        # Folder path of the 'Auto Press'
        folder_path = './Data/New_HalcoR_Data(2024)/OneDrive_1_12-5-2024/Auto Press/'
        sensor_dataframe = unify_csv(folder_path, "autopress")
        # ------maybe drop these inside the function from earlier
        sensor_dataframe.drop(columns= ['Relativzeit', 'Datum', 'Absolutzeit'], inplace= True)
        sensor_dataframe['Timestamp'] = pd.to_datetime(sensor_dataframe['Timestamp'])
        timeWindows = self.energy_data['Timestamp'].tolist()
        labels = timeWindows[1:]
        sensor_dataframe['Time Bin'] = pd.cut(sensor_dataframe['Timestamp'], timeWindows, labels=labels, right=False)
        start_timestamp = self.energy_data['Timestamp'][0]
        sensor_dataframe = sensor_dataframe[sensor_dataframe['Timestamp'] >= start_timestamp]
        for column in sensor_dataframe.columns:
            missing_percentage = sensor_dataframe[column].isnull().mean() * 100
            is_unique = sensor_dataframe[column].nunique(dropna=False) == 1
            binary_unique = sensor_dataframe[column].nunique() == 2
            # drop columns with higher than 20% missing rate || drop columns that have a constant unique value, thus not offering any info || Drop binary columns for now
            if missing_percentage > 20 or is_unique or binary_unique:
                sensor_dataframe.drop(columns= column, inplace=True)
                
        sensor_dataframe.drop(columns='Timestamp', inplace=True)
        sensor_dataframe['Time Bin'] = pd.to_datetime(sensor_dataframe['Time Bin'])
        sensor_dataframe = sensor_dataframe.groupby('Time Bin', sort=True).mean().reset_index()
        # # PLC raw data file
        # path_to_plc_raw_data_file = ''
        # plcBestframe = pd.read_csv(path_to_plc_raw_data_file).drop_duplicates().dropna()
        # # Concatenate date column (YEAR-MONTH-DAY) with time column (HOUR-MINUTES-SECONDS)
        # plcBestframe['Timestamp'] = plcBestframe[['Calendar (Production) date','End time']].T.agg(lambda x: (x.values[0]+' '+x.values[1]))
        # plcBestframe['Timestamp'] = pd.to_datetime(plcBestframe['Timestamp'], format='%Y-%m-%d %H:%M:%S')
        # plcBestframe = plcBestframe.drop(columns=['Calendar (Production) date','End time','Start time','PLC Production Date'])
        # plcBestframe.drop("Unnamed: 0", axis= 1)
        # timeWindows = self.energy_data['Timestamp'].tolist()
        # labels = self.energy_data['Timestamp'].tolist()

        # if self.resample_flag == '1w':
        #     labels = labels[1:]
        # else:
        #     # The starting timestamp of the dataset. This is in order to create time bins and assign each resample_flag interval values to the data granularity.
        #     start_datetime = ''
        #     timeWindows.insert(0, pd.to_datetime(start_datetime, format='%Y-%m-%d %H:%M:%S'))
        
        # plcBestframe['Time Bin'] = pd.cut(plcBestframe['Timestamp'], timeWindows, labels=labels, right=False)
        # plcBestframe.drop("Unnamed: 0", axis= 1, inplace=True)

        # # Categorical features of the dataset
        # plcBestframe['Product Group'] = plcBestframe['Product Group'].astype('str')
        # plcBestframe['SKU code'] = plcBestframe['SKU code'].astype('str')
        # plcBestframe['Event Code'] = plcBestframe['Event Code'].astype('str')
        # # Create sets for columns with string values (In order to have unique set of categories). Sum for columns with numerical features
        # plcBestframe = plcBestframe.groupby('Time Bin', sort=True).agg({'Product Group':set,'SKU code':set,'Event Code':set,'Production Quantity (#) ':sum,'Duration (sec)':sum,'Καθαρές Μηχανοώρες (min)':sum}).reset_index()

        # # MES raw data file
        # path_to_mes_raw_data_file = ''
        # mesBestframe = pd.read_csv(path_to_mes_raw_data_file).drop_duplicates().dropna()
        # timeWindows = self.energy_data['Timestamp'].tolist()
        # labels = self.energy_data['Timestamp'].tolist()
        # if self.resample_flag == '1w':
        #     labels = labels[1:]
        # else:
        #     # The starting timestamp of the dataset. This is in order to create time bins and assign each resample_flag interval values to the data granularity.
        #     start_datetime = ''
        #     timeWindows.insert(0, pd.to_datetime(start_datetime, format='%Y-%m-%d %H:%M:%S'))
        # mesBestframe['Time Bin'] = pd.cut(mesBestframe['End Time'], timeWindows, labels=labels, right=False)
        # mesBestframe.drop("Unnamed: 0", axis= 1, inplace=True)
        # mesBestframe = mesBestframe[:-1]
        # # Categorical features of the dataset
        # mesBestframe['Περιγραφή υλικού'] = mesBestframe['Περιγραφή υλικού'].astype('str')
        # mesBestframe['Work Center'] = mesBestframe['Work Center'].astype('str')
        # mesBestframe['Event Code'] = mesBestframe['Event Code'].astype('str')
        # # Create sets for columns with string values (In order to have unique set of categories). Sum for columns with numerical features
        # mesBestframe = mesBestframe.groupby('Time Bin', sort=True).agg({'Περιγραφή υλικού':set,'Work Center':set,'Event Code':set,'Production Quantity (#)':sum,'Duration (min)':sum}).reset_index()

        # #Merge MES and PLC dataframes
        # bestFrame = plcBestframe.join(mesBestframe.set_index('Time Bin'), on='Time Bin', lsuffix='_plc',rsuffix='_mes')
        # bestFrame.rename(columns={'Production Quantity (#) ': 'products_plc', 'Production Quantity (#)':'products_mes'}, inplace=True)
        # bestFrame['Production Quantity (#)'] = bestFrame['products_plc'] + bestFrame['products_mes']

        # bestFrame['Time Bin'] = pd.to_datetime(bestFrame['Time Bin'], errors='raise')
        # self.energy_data.set_index('Timestamp', inplace=True)
        # bestFrame.set_index('Time Bin', inplace=True)
        # self.energy_data = self.energy_data.join(bestFrame, lsuffix='out_', rsuffix='in_')
        # self.energy_data.reset_index(inplace=True)

        # # Load the PLC csv files
        # plc_anal_df = load_all_csv_PLC()
        # # Concatenate date column (YEAR-MONTH-DAY) with time column (HOUR-MINUTES-SECONDS)
        # plc_anal_df['Timestamp'] = plc_anal_df[['Datum','Absolutzeit']].T.agg(lambda x: (x.values[0]+' '+x.values[1]))
        # plc_anal_df['Timestamp'] = pd.to_datetime(plc_anal_df['Timestamp'], format='%d.%m.%Y %H:%M:%S.%f').dt.strftime('%Y-%m-%d %H:%M:%S')
        # plc_anal_df['Timestamp'] = pd.to_datetime(plc_anal_df['Timestamp'], format='%Y-%m-%d %H:%M:%S')
        # plc_anal_df.drop(columns = ['Datum', 'Absolutzeit', 'Relativzeit'], inplace=True)
        # # Some timestamps are 2021 instead of 2022. Replace 2021 to 2022 in timestamps
        # plc_anal_df['Timestamp'] = plc_anal_df['Timestamp'].apply(lambda x: x.replace(year=2022) if x.year == 2021 else x)
        # #create time bins
        # timeWindows = self.energy_data['Timestamp'].tolist()
        # labels = self.energy_data['Timestamp'].tolist()
        # if self.resample_flag == '1w':
        #     labels = labels[1:]
        # else:
        #     # The starting timestamp of the dataset. This is in order to create time bins and assign each resample_flag interval values to the data granularity.
        #     start_datetime = ''
        #     timeWindows.insert(0, pd.to_datetime(start_datetime, format='%Y-%m-%d %H:%M:%S'))
        # plc_anal_df['Time Bin'] = pd.cut(plc_anal_df['Timestamp'], timeWindows, labels=labels, right=False)
        # plc_anal_df = plc_anal_df.groupby('Time Bin').mean().reset_index()
        # plc_anal_df.drop(columns = ['Timestamp','Trigger','Fehler'], inplace=True)

        self.energy_data.set_index('Timestamp', inplace=True)
        sensor_dataframe.set_index('Time Bin', inplace=True)
        self.energy_data = self.energy_data.join(sensor_dataframe, how = 'left', lsuffix='out_', rsuffix='in_')
        self.energy_data.reset_index(inplace=True)
        # self.energy_data.drop(columns = ['products_plc','products_mes', 'Περιγραφή υλικού'], inplace=True)
        # self.energy_data = self.energy_data.applymap(lambda x : np.nan if not x else x) # convert empty sets into nan so i can do fillna later

        # forward fill seems appropriate for this kind of data to fill the NaN values, since we want to maintain the temporal consistency
        # self.energy_data = self.energy_data.fillna(method='ffill').fillna(method='bfill')
        return self.energy_data
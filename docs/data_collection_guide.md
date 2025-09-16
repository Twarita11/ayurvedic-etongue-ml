# Ayurvedic Medicine Sensor Data Collection Guidelines

## Data Collection Template

### Required Measurements
For each sample, collect the following measurements:
1. NIR sensor readings (6 wavelengths):
   - R wavelength
   - S wavelength
   - T wavelength
   - U wavelength
   - V wavelength
   - W wavelength
2. Temperature reading
3. Medicine information:
   - Medicine name
   - Dilution percentage
   - Effectiveness score (if available)

### Dilution Levels
Test each medicine at these dilution levels:
- 100% (pure)
- 75%
- 50%
- 25%
- 10%

### Number of Readings
- Take 20-30 readings per dilution level
- Ensure consistent measurement conditions
- Record readings in sequence

### CSV Format
Save data in CSV format with these columns:
```
R,S,T,U,V,W,Temperature,Dilution_Percent,Medicine_Name,Effectiveness_Score,Reading_ID
```

Example:
```
R,S,T,U,V,W,Temperature,Dilution_Percent,Medicine_Name,Effectiveness_Score,Reading_ID
3.5,2.8,4.2,3.0,3.8,2.5,25.0,100,Ashwagandha,0.95,1
```

## Measurement Guidelines

### Preparation
1. Ensure sensors are calibrated
2. Clean sensor surfaces
3. Allow samples to reach room temperature
4. Note environmental conditions

### Taking Measurements
1. Place sample in measurement cell
2. Wait for temperature stabilization
3. Record all sensor readings
4. Clean measurement cell between samples
5. Note any anomalies or issues

### Quality Control
- Verify sensor readings are within expected ranges
- Check for outliers or unusual patterns
- Document any deviations or special conditions
- Maintain consistent measurement conditions

### Data Validation
Before submitting data, verify:
1. All required columns are present
2. No missing values
3. Values are within expected ranges
4. Proper formatting of numbers
5. Consistent naming conventions

## Troubleshooting

### Common Issues
1. Unexpected sensor readings:
   - Check sensor calibration
   - Clean measurement cell
   - Verify sample preparation
   
2. Temperature fluctuations:
   - Allow system to stabilize
   - Check ambient conditions
   - Verify temperature sensor

3. Data inconsistencies:
   - Review measurement procedure
   - Check data entry
   - Validate calculations

### Support
For technical issues or questions:
1. Document the problem
2. Note any error messages
3. Record environmental conditions
4. Contact technical support

## Safety Guidelines
1. Handle medicines safely
2. Use appropriate protective equipment
3. Follow proper disposal procedures
4. Keep workspace clean and organized

## Data Submission
1. Save CSV files with clear naming:
   ```
   YYYYMMDD_MedicineName_BatchNumber.csv
   ```
2. Include metadata file with:
   - Operator name
   - Date and time
   - Environmental conditions
   - Any notable observations
3. Submit data files to designated repository


# ExoDetect AI - Exoplanet Detection System

A modern, responsive web application that detects exoplanets using NASA Kepler light curve data through advanced signal processing algorithms. Built with Next.js, React, and Recharts.

## 🌟 Features

- **CSV File Upload**: Drag-and-drop or click-to-select interface for uploading light curve data
- **Signal Processing**: Fourier Transform-based frequency analysis to detect periodic signals
- **Exoplanet Detection**: Identifies transit signatures in stellar brightness measurements
- **Comprehensive Analysis**: Calculates orbital period, transit depth, and signal-to-noise ratio
- **Interactive Visualizations**: 
  - Original light curve plot
  - Detrended light curve (trends removed)
  - Power spectrum (periodogram) showing frequency analysis
  - Folded light curve (when exoplanet detected)
- **Confidence Scoring**: Composite metric combining multiple detection factors
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **No Backend Required**: Entirely frontend-based processing runs in the browser

## 🔬 The Science

### Transit Method
ExoDetect AI uses the **transit method**, the most successful technique for discovering exoplanets. When a planet orbits in front of its host star, it causes a small, periodic dip in the star's brightness called a transit.

### Detection Algorithm

The system analyzes light curves through these steps:

1. **Data Normalization**: Scales flux values to 0-1 range
2. **Noise Reduction**: Median filtering (5-point window) smooths data
3. **Detrending**: Polynomial (degree 2) fit subtraction removes long-term variations
4. **Frequency Analysis**: Fast Fourier Transform (FFT) reveals periodic signals
5. **Peak Detection**: Identifies dominant frequencies (candidate orbital periods)
6. **Transit Analysis**: Measures signal depth and consistency
7. **Confidence Scoring**: Combines multiple metrics for reliability assessment

### Key Metrics

- **Orbital Period**: How long the planet takes to orbit its star (in days)
- **Transit Depth**: Fractional decrease in brightness during transit (in parts per million - ppm)
- **Signal-to-Noise Ratio (SNR)**: How clearly the signal stands out above background noise
- **Confidence Score**: Composite metric (0-100%) indicating detection reliability

## 📋 Expected CSV Format

Your light curve data should be in CSV format with the following columns:

```
TIME,FLUX
2454833.00000,1.000000
2454833.02083,0.999500
...
```

### Column Names
The system automatically recognizes common column names:

**Time Data:**
- `TIME` or `JD` (Julian Date)
- `t_` prefix (e.g., `t_0`, `t_data`)

**Flux Data:**
- `FLUX`
- `SAP_FLUX` (Simple Aperture Photometry)
- `PDCSAP_FLUX` (Pre-search Data Conditioning)

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone <repo-url>

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Visit `http://localhost:3000` in your browser.

### Usage

1. **Upload Data**: Click "Select File" or drag-and-drop your CSV file
2. **Analysis Runs**: The system automatically processes your data
3. **View Results**: See detection results, metrics, and visualizations
4. **Download Report**: Export a detailed analysis report as text

## 📁 Project Structure

```
/vercel/share/v0-project/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Home page with upload interface
│   └── results/
│       └── page.tsx        # Results and visualization page
├── components/
│   ├── Header.tsx          # Navigation header
│   ├── FileUploader.tsx    # CSV upload component
│   ├── MetricsPanel.tsx    # Key metrics display
│   ├── ResultsChart.tsx    # Interactive visualizations
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── dataProcessor.ts    # CSV parsing & data preprocessing
│   ├── signalProcessing.ts # FFT & signal analysis
│   ├── exoplanetDetector.ts# Main detection algorithm
│   └── utils.ts            # Utility functions
├── types/
│   └── index.ts            # TypeScript interfaces
├── public/
│   └── sample_light_curve.csv  # Sample data for testing
└── globals.css             # Tailwind CSS configuration
```

## 💻 Core Libraries

- **Next.js 16**: React framework with App Router
- **React 19**: UI component framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Accessible React components
- **Recharts**: Interactive charting library
- **PapaParse**: CSV parsing
- **numeric.js**: Numerical computation utilities

## 🔧 Technical Implementation

### Signal Processing (lib/signalProcessing.ts)

**FFT Implementation**: Cooley-Tukey recursive algorithm for Fast Fourier Transform
- Pads input to nearest power of 2
- Splits into even/odd indices
- Applies twiddle factors for frequency transformation
- Returns magnitude spectrum as periodogram

**Periodogram Computation**: Converts FFT output to frequency-power representation
- Normalizes frequencies to cycles/day
- Calculates power for each frequency bin
- Used to identify periodic signals

**Peak Detection**: Finds dominant frequencies in the power spectrum
- Sorts peaks by power in descending order
- Filters out frequencies that are too close together
- Returns top N peaks (default: 5)

**Folded Light Curve**: Aligns data at detected orbital period
- Maps time indices to orbital phase (0-1)
- Groups measurements by phase
- Creates phase-flux scatter plot showing transit dip

**SNR Calculation**: Measures signal clarity
- Estimates noise as RMS of flux deviations from mean
- Transit signal = magnitude of transit depth
- SNR = signal / noise ratio

### Data Processing (lib/dataProcessor.ts)

**CSV Parsing**: Flexible column detection
- Supports multiple time column names (TIME, JD, t_*)
- Supports multiple flux column names (FLUX, SAP_FLUX, PDCSAP_FLUX)
- Validates data and filters invalid rows
- Returns structured time and flux arrays

**Normalization**: Scales data to 0-1 range
- Finds min/max of flux values
- Linear scaling: `(f - min) / (max - min)`

**Median Filtering**: Reduces noise while preserving transits
- 5-point sliding window
- Maintains signal sharpness better than Gaussian filters

**Polynomial Detrending**: Removes long-term variations
- Fits polynomial (degree 2) to original data
- Subtracts trend from flux values
- Gaussian elimination with partial pivoting for numerical stability

### Detection Algorithm (lib/exoplanetDetector.ts)

**Pipeline**:
1. Parse and validate CSV
2. Normalize flux values
3. Apply median filter
4. Detrend with polynomial fit
5. Compute periodogram via FFT
6. Find dominant peaks
7. Analyze each peak for transit signals
8. Calculate confidence score
9. Return detection result with metadata

**Confidence Calculation**:
```
Confidence = Transit_Depth_Score (40%) + SNR_Score (35%) + Peak_Power_Score (25%)
```

**Detection Thresholds**:
- Minimum transit depth: 50 ppm
- Minimum SNR: 7.0
- Minimum peak power: 0.01
- Minimum confidence: 40%

## 📊 Visualizations

### Light Curve Plot
Shows original stellar brightness measurements over time. Transits appear as small periodic dips.

### Detrended Light Curve
Original light curve with polynomial trend removed. Makes periodic signals more obvious.

### Periodogram (Power Spectrum)
Frequency analysis showing which periodicities are strongest in the data. Exoplanet orbital periods appear as peaks.

### Folded Light Curve
Light curve "folded" at the detected orbital period. All transits are aligned, revealing the transit signature clearly.

## 🧪 Testing with Sample Data

A sample light curve file is included at `/public/sample_light_curve.csv`. This synthetic data includes a simulated exoplanet transit with:
- Orbital period: ~4 days
- Transit depth: ~500 ppm
- Data points: 200+ measurements

## ⚙️ Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📈 Performance

- **Analysis Speed**: ~1-5 seconds for typical light curves (200-5000 points)
- **Memory**: All processing done in browser, no data sent to servers
- **Bundle Size**: ~500KB (including Recharts)

## 🔒 Privacy

All data processing happens entirely in your browser:
- No data uploaded to any server
- No cookies or tracking
- All computations run client-side
- Safe for proprietary data analysis

## 📝 Output

### Detection Results
- Binary classification (exoplanet detected or not)
- Confidence percentage (0-100%)
- Key metrics when exoplanet detected

### Downloadable Report
Text file containing:
- Detection results and confidence
- Orbital characteristics
- Data summary statistics
- Detection methodology explanation
- Analysis timestamp

## 🎓 Educational Value

This application demonstrates:
- Real signal processing techniques used in astronomy
- FFT and frequency domain analysis
- Transit photometry methods
- Confidence scoring in scientific detection
- Data preprocessing and detrending

## 🚀 Future Enhancements

Potential additions:
- Additional detection methods (TLS, BLS algorithms)
- Multi-planet detection
- Stellar parameter integration
- Comparison with known exoplanet databases
- Export of folded light curves
- Batch file processing
- Advanced filtering options

## 📚 References

- NASA Exoplanet Archive: https://exoplanetarchive.ipac.caltech.edu/
- Kepler Space Telescope Mission: https://www.nasa.gov/mission_pages/kepler/
- Transit Method: https://en.wikipedia.org/wiki/Transiting_exoplanet

## 📄 License

This project is open source and available under the MIT License.

## 👥 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest improvements
- Submit pull requests
- Improve documentation

---

**Built with ❤️ for exoplanet discovery**

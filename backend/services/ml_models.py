import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor

def generate_durian_yield_dataset(n_samples=1000, seed=42):
    """
    Generates a synthetic durian yield dataset representing historical regional durian harvests.
    Features: [temperature (°C), rainfall (mm), soil_ph, fertilizer (kg/hectare)]
    Target: yield (kg / hectare)
    """
    np.random.seed(seed)
    
    # 1. Generate inputs within typical tropical cultivation windows
    temp = np.random.uniform(22.0, 36.0, n_samples)
    rain = np.random.uniform(60.0, 320.0, n_samples)
    ph = np.random.uniform(4.8, 7.8, n_samples)
    fert = np.random.uniform(30.0, 240.0, n_samples)
    
    # 2. Vectorized crop science curves modeling sweet spot optimums
    temp_factor = np.exp(-0.04 * ((temp - 27.5) ** 2))
    rain_factor = np.exp(-0.00008 * ((rain - 170.0) ** 2))
    ph_factor = np.exp(-0.7 * ((ph - 6.3) ** 2))
    fert_factor = np.exp(-0.00003 * ((fert - 130.0) ** 2))
    
    # 3. Calculate yields with a baseline maximum of 480 kg/ha + natural noise (+-15kg)
    base_yields = 480.0 * temp_factor * rain_factor * ph_factor * fert_factor
    noise = np.random.uniform(-15.0, 15.0, n_samples)
    yields = np.clip(base_yields + noise, 20.0, None)
    
    # X shape (n_samples, 4), y shape (n_samples,)
    X = np.stack([temp, rain, ph, fert], axis=1)
    y = yields
    
    return X, y

def calculate_accuracy(y_true, y_pred):
    """
    Calculates Weighted Absolute Percentage Error (WAPE) based accuracy.
    This avoids division-by-zero or extreme percentage errors for low true yields.
    Accuracy % = 100 * (1 - Sum(|y_true - y_pred|) / Sum(y_true))
    """
    total_abs_error = np.sum(np.abs(y_true - y_pred))
    total_actual = np.sum(y_true)
    if total_actual == 0:
        return 0.0
    wape = total_abs_error / total_actual
    accuracy_pct = 100.0 * (1.0 - wape)
    return round(max(0.0, min(100.0, accuracy_pct)), 2)

def train_and_evaluate_models():
    """
    Trains standard scikit-learn models on the generated dataset.
    Returns: (lr_model, rf_model, scaler, lr_accuracy, rf_accuracy)
    """
    X, y = generate_durian_yield_dataset(n_samples=1000, seed=42)
    
    # Train/Validation split (80/20)
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Standardize inputs using StandardScaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    
    # Train Linear Regression
    lr = LinearRegression()
    lr.fit(X_train_scaled, y_train)
    lr_preds = lr.predict(X_val_scaled)
    lr_accuracy = calculate_accuracy(y_val, lr_preds)
    
    # Train Random Forest Regressor
    rf = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
    rf.fit(X_train_scaled, y_train)
    rf_preds = rf.predict(X_val_scaled)
    rf_accuracy = calculate_accuracy(y_val, rf_preds)
    
    return lr, rf, scaler, lr_accuracy, rf_accuracy

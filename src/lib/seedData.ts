// Dummy data for categories
export const dummyCategories = [
    {
        name: "Pain Relief",
        description: "Medicines for relieving various types of pain including headaches, muscle aches, and joint pain",
        isOTC: true,
        icon: "💊",
        isActive: true
    },
    {
        name: "Antibiotics",
        description: "Prescription medications to treat bacterial infections",
        isOTC: false,
        icon: "💉",
        isActive: true
    },
    {
        name: "Vitamins & Supplements",
        description: "Essential vitamins, minerals, and dietary supplements for overall health",
        isOTC: true,
        icon: "🧪",
        isActive: true
    },
    {
        name: "Cold & Flu",
        description: "Over-the-counter medications for cold, flu, and respiratory symptoms",
        isOTC: true,
        icon: "🤧",
        isActive: true
    },
    {
        name: "Digestive Health",
        description: "Medicines for treating digestive issues, heartburn, and stomach problems",
        isOTC: true,
        icon: "🏥",
        isActive: true
    },
    {
        name: "Cardiovascular",
        description: "Prescription medications for heart and blood pressure management",
        isOTC: false,
        icon: "❤️",
        isActive: true
    },
    {
        name: "Diabetes Care",
        description: "Insulin and medications for diabetes management",
        isOTC: false,
        icon: "💉",
        isActive: true
    },
    {
        name: "Skin Care",
        description: "Topical treatments for skin conditions, rashes, and dermatological issues",
        isOTC: true,
        icon: "🩹",
        isActive: true
    },
    {
        name: "Allergy Relief",
        description: "Antihistamines and medications for seasonal and food allergies",
        isOTC: true,
        icon: "🌸",
        isActive: true
    },
    {
        name: "Eye Care",
        description: "Eye drops and medications for various eye conditions",
        isOTC: true,
        icon: "👁️",
        isActive: true
    },
    {
        name: "Mental Health",
        description: "Prescription medications for anxiety, depression, and mental health conditions",
        isOTC: false,
        icon: "🧠",
        isActive: true
    },
    {
        name: "Sleep Aids",
        description: "Medications to help with sleep disorders and insomnia",
        isOTC: true,
        icon: "😴",
        isActive: true
    },
    {
        name: "Respiratory",
        description: "Inhalers and medications for asthma and breathing conditions",
        isOTC: false,
        icon: "🫁",
        isActive: true
    },
    {
        name: "Women's Health",
        description: "Medications specific to women's health needs",
        isOTC: true,
        icon: "👩",
        isActive: true
    },
    {
        name: "Children's Medicine",
        description: "Safe and effective medications formulated for children",
        isOTC: true,
        icon: "👶",
        isActive: true
    }
];

// Dummy data for subcategories (to be created after categories)
export const dummySubcategories = [
    // Pain Relief subcategories
    { name: "Headache Relief", description: "Fast-acting pain relief for headaches and migraines", categoryName: "Pain Relief", isOTC: true },
    { name: "Muscle Pain", description: "Topical and oral pain relief for muscle aches", categoryName: "Pain Relief", isOTC: true },
    { name: "Joint Pain", description: "Anti-inflammatory medications for arthritis and joint pain", categoryName: "Pain Relief", isOTC: true },

    // Antibiotics subcategories
    { name: "Penicillins", description: "Broad-spectrum antibiotics for bacterial infections", categoryName: "Antibiotics", isOTC: false },
    { name: "Cephalosporins", description: "Beta-lactam antibiotics for various infections", categoryName: "Antibiotics", isOTC: false },
    { name: "Macrolides", description: "Antibiotics for respiratory and skin infections", categoryName: "Antibiotics", isOTC: false },

    // Vitamins & Supplements subcategories
    { name: "Multivitamins", description: "Complete daily vitamin and mineral supplements", categoryName: "Vitamins & Supplements", isOTC: true },
    { name: "Vitamin D", description: "Supplements for bone health and immune support", categoryName: "Vitamins & Supplements", isOTC: true },
    { name: "Omega-3 Fatty Acids", description: "Fish oil supplements for heart and brain health", categoryName: "Vitamins & Supplements", isOTC: true },
    { name: "Probiotics", description: "Beneficial bacteria for digestive health", categoryName: "Vitamins & Supplements", isOTC: true },

    // Cold & Flu subcategories
    { name: "Cough Suppressants", description: "Medications to reduce coughing", categoryName: "Cold & Flu", isOTC: true },
    { name: "Decongestants", description: "Nasal and sinus congestion relief", categoryName: "Cold & Flu", isOTC: true },
    { name: "Fever Reducers", description: "Medications to lower body temperature", categoryName: "Cold & Flu", isOTC: true },

    // Digestive Health subcategories
    { name: "Antacids", description: "Fast relief from heartburn and acid reflux", categoryName: "Digestive Health", isOTC: true },
    { name: "Laxatives", description: "Treatments for constipation", categoryName: "Digestive Health", isOTC: true },
    { name: "Anti-Diarrheal", description: "Medications to stop diarrhea", categoryName: "Digestive Health", isOTC: true },

    // Cardiovascular subcategories
    { name: "ACE Inhibitors", description: "Blood pressure lowering medications", categoryName: "Cardiovascular", isOTC: false },
    { name: "Beta Blockers", description: "Heart rate and blood pressure control", categoryName: "Cardiovascular", isOTC: false },
    { name: "Statins", description: "Cholesterol-lowering medications", categoryName: "Cardiovascular", isOTC: false },

    // Diabetes Care subcategories
    { name: "Rapid-Acting Insulin", description: "Fast-acting insulin for mealtime use", categoryName: "Diabetes Care", isOTC: false },
    { name: "Long-Acting Insulin", description: "Extended duration insulin for basal coverage", categoryName: "Diabetes Care", isOTC: false },
    { name: "Oral Hypoglycemics", description: "Pills to lower blood sugar levels", categoryName: "Diabetes Care", isOTC: false },

    // Skin Care subcategories
    { name: "Acne Treatment", description: "Topical and oral medications for acne", categoryName: "Skin Care", isOTC: true },
    { name: "Eczema Relief", description: "Creams and ointments for eczema", categoryName: "Skin Care", isOTC: true },
    { name: "Antifungal", description: "Treatments for fungal skin infections", categoryName: "Skin Care", isOTC: true },

    // Allergy Relief subcategories
    { name: "Antihistamines", description: "Non-drowsy allergy relief", categoryName: "Allergy Relief", isOTC: true },
    { name: "Nasal Sprays", description: "Steroid and saline nasal sprays for allergies", categoryName: "Allergy Relief", isOTC: true },
];

// Dummy data for medicines (to be created after categories and subcategories)
export const dummyMedicines = [
    // Pain Relief medicines
    { name: "Ibuprofen 400mg", description: "Fast-acting pain and inflammation relief", manufacturer: "Pfizer", category: "Tablet", categoryName: "Pain Relief", subCategoryName: "Headache Relief", price: 8.99, stock: 150, batchNumber: "IBU001-2024", expiryDays: 730, isOTC: true, requiresPrescription: false },
    { name: "Acetaminophen 500mg", description: "Effective pain reliever and fever reducer", manufacturer: "Johnson & Johnson", category: "Tablet", categoryName: "Pain Relief", subCategoryName: "Headache Relief", price: 6.50, stock: 200, batchNumber: "ACT002-2024", expiryDays: 720, isOTC: true, requiresPrescription: false },
    { name: "Aspirin 325mg", description: "Pain relief and blood thinner", manufacturer: "Bayer", category: "Tablet", categoryName: "Pain Relief", subCategoryName: "Headache Relief", price: 5.99, stock: 180, batchNumber: "ASP003-2024", expiryDays: 700, isOTC: true, requiresPrescription: false },

    // Antibiotics medicines
    { name: "Amoxicillin 500mg", description: "Broad-spectrum antibiotic for bacterial infections", manufacturer: "GSK", category: "Capsule", categoryName: "Antibiotics", subCategoryName: "Penicillins", price: 15.50, stock: 80, batchNumber: "AMX004-2024", expiryDays: 540, isOTC: false, requiresPrescription: true },
    { name: "Azithromycin 250mg", description: "Macrolide antibiotic for respiratory infections", manufacturer: "Pfizer", category: "Tablet", categoryName: "Antibiotics", subCategoryName: "Macrolides", price: 22.00, stock: 60, batchNumber: "AZI005-2024", expiryDays: 600, isOTC: false, requiresPrescription: true },

    // Vitamins & Supplements
    { name: "Centrum Multivitamin", description: "Complete daily multivitamin supplement", manufacturer: "Pfizer", category: "Tablet", categoryName: "Vitamins & Supplements", subCategoryName: "Multivitamins", price: 18.99, stock: 120, batchNumber: "CEN006-2024", expiryDays: 900, isOTC: true, requiresPrescription: false },
    { name: "Vitamin D3 2000 IU", description: "Bone health and immune support", manufacturer: "Nature Made", category: "Capsule", categoryName: "Vitamins & Supplements", subCategoryName: "Vitamin D", price: 12.50, stock: 150, batchNumber: "VTD007-2024", expiryDays: 850, isOTC: true, requiresPrescription: false },
    { name: "Omega-3 Fish Oil 1000mg", description: "Heart and brain health support", manufacturer: "Nordic Naturals", category: "Capsule", categoryName: "Vitamins & Supplements", subCategoryName: "Omega-3 Fatty Acids", price: 25.99, stock: 90, batchNumber: "OMG008-2024", expiryDays: 730, isOTC: true, requiresPrescription: false },

    // Cold & Flu medicines
    { name: "Robitussin Cough Syrup", description: "Cough suppressant and expectorant", manufacturer: "GSK", category: "Syrup", categoryName: "Cold & Flu", subCategoryName: "Cough Suppressants", price: 14.99, stock: 100, batchNumber: "ROB009-2024", expiryDays: 540, isOTC: true, requiresPrescription: false },
    { name: "Sudafed Decongestant 30mg", description: "Nasal congestion relief", manufacturer: "Johnson & Johnson", category: "Tablet", categoryName: "Cold & Flu", subCategoryName: "Decongestants", price: 9.99, stock: 140, batchNumber: "SUD010-2024", expiryDays: 600, isOTC: true, requiresPrescription: false },
    { name: "Tylenol Cold + Flu", description: "Multi-symptom cold and flu relief", manufacturer: "Johnson & Johnson", category: "Tablet", categoryName: "Cold & Flu", subCategoryName: "Fever Reducers", price: 11.50, stock: 110, batchNumber: "TYL011-2024", expiryDays: 650, isOTC: true, requiresPrescription: false },

    // Digestive Health medicines
    { name: "Tums Antacid", description: "Fast heartburn and acid indigestion relief", manufacturer: "GSK", category: "Tablet", categoryName: "Digestive Health", subCategoryName: "Antacids", price: 7.99, stock: 160, batchNumber: "TUM012-2024", expiryDays: 700, isOTC: true, requiresPrescription: false },
    { name: "Dulcolax Laxative", description: "Gentle relief from constipation", manufacturer: "Boehringer Ingelheim", category: "Tablet", categoryName: "Digestive Health", subCategoryName: "Laxatives", price: 10.50, stock: 85, batchNumber: "DUL013-2024", expiryDays: 680, isOTC: true, requiresPrescription: false },
    { name: "Imodium A-D", description: "Anti-diarrheal medication", manufacturer: "Johnson & Johnson", category: "Capsule", categoryName: "Digestive Health", subCategoryName: "Anti-Diarrheal", price: 12.99, stock: 95, batchNumber: "IMO014-2024", expiryDays: 720, isOTC: true, requiresPrescription: false },

    // Cardiovascular medicines
    { name: "Lisinopril 10mg", description: "ACE inhibitor for blood pressure control", manufacturer: "Merck", category: "Tablet", categoryName: "Cardiovascular", subCategoryName: "ACE Inhibitors", price: 18.00, stock: 70, batchNumber: "LIS015-2024", expiryDays: 540, isOTC: false, requiresPrescription: true },
    { name: "Metoprolol 50mg", description: "Beta blocker for heart conditions", manufacturer: "AstraZeneca", category: "Tablet", categoryName: "Cardiovascular", subCategoryName: "Beta Blockers", price: 20.50, stock: 65, batchNumber: "MET016-2024", expiryDays: 600, isOTC: false, requiresPrescription: true },
    { name: "Atorvastatin 20mg", description: "Statin for cholesterol management", manufacturer: "Pfizer", category: "Tablet", categoryName: "Cardiovascular", subCategoryName: "Statins", price: 25.00, stock: 75, batchNumber: "ATO017-2024", expiryDays: 650, isOTC: false, requiresPrescription: true },

    // Diabetes Care medicines
    { name: "NovoRapid FlexPen", description: "Rapid-acting insulin for mealtime control", manufacturer: "Novo Nordisk", category: "Injection", categoryName: "Diabetes Care", subCategoryName: "Rapid-Acting Insulin", price: 85.00, stock: 40, batchNumber: "NOV018-2024", expiryDays: 365, isOTC: false, requiresPrescription: true },
    { name: "Lantus SoloStar", description: "Long-acting basal insulin", manufacturer: "Sanofi", category: "Injection", categoryName: "Diabetes Care", subCategoryName: "Long-Acting Insulin", price: 95.00, stock: 35, batchNumber: "LAN019-2024", expiryDays: 365, isOTC: false, requiresPrescription: true },
    { name: "Metformin 500mg", description: "Oral medication to lower blood sugar", manufacturer: "Bristol-Myers Squibb", category: "Tablet", categoryName: "Diabetes Care", subCategoryName: "Oral Hypoglycemics", price: 12.00, stock: 100, batchNumber: "MET020-2024", expiryDays: 720, isOTC: false, requiresPrescription: true },

    // Skin Care medicines
    { name: "Benzoyl Peroxide 5% Gel", description: "Topical acne treatment", manufacturer: "Neutrogena", category: "Cream", categoryName: "Skin Care", subCategoryName: "Acne Treatment", price: 14.50, stock: 110, batchNumber: "BEN021-2024", expiryDays: 540, isOTC: true, requiresPrescription: false },
    { name: "Hydrocortisone 1% Cream", description: "Anti-inflammatory for eczema and rashes", manufacturer: "Johnson & Johnson", category: "Cream", categoryName: "Skin Care", subCategoryName: "Eczema Relief", price: 8.99, stock: 130, batchNumber: "HYD022-2024", expiryDays: 600, isOTC: true, requiresPrescription: false },
    { name: "Clotrimazole Cream", description: "Antifungal treatment for skin infections", manufacturer: "Bayer", category: "Cream", categoryName: "Skin Care", subCategoryName: "Antifungal", price: 11.50, stock: 90, batchNumber: "CLO023-2024", expiryDays: 650, isOTC: true, requiresPrescription: false },

    // Allergy Relief medicines
    { name: "Claritin 10mg", description: "24-hour non-drowsy allergy relief", manufacturer: "Bayer", category: "Tablet", categoryName: "Allergy Relief", subCategoryName: "Antihistamines", price: 16.99, stock: 125, batchNumber: "CLA024-2024", expiryDays: 730, isOTC: true, requiresPrescription: false },
    { name: "Flonase Nasal Spray", description: "Corticosteroid nasal spray for allergies", manufacturer: "GSK", category: "Drops", categoryName: "Allergy Relief", subCategoryName: "Nasal Sprays", price: 19.99, stock: 80, batchNumber: "FLO025-2024", expiryDays: 540, isOTC: true, requiresPrescription: false },
];

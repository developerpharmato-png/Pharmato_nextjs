// Dummy data for categories
export const dummyCategories = [
    {
        name: "Pain Relief",
        description: "Medicines for relieving various types of pain including headaches, muscle aches, and joint pain",
        isOTC: true,
        images: ["https://images.unsplash.com/photo-1515378791036-0648a3ef77b2"],
        isActive: true
    },
    {
        name: "Antibiotics",
        description: "Prescription medications to treat bacterial infections",
        isOTC: false,
        images: ["https://images.unsplash.com/photo-1465101046530-73398c7f28ca"],
        isActive: true
    },
    {
        name: "Vitamins & Supplements",
        description: "Essential vitamins, minerals, and dietary supplements for overall health",
        isOTC: true,
        images: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb"],
        isActive: true
    },
    {
        name: "Cold & Flu",
        description: "Over-the-counter medications for cold, flu, and respiratory symptoms",
        isOTC: true,
        images: ["https://images.unsplash.com/photo-1519864600265-abb23847ef2c"],
        isActive: true
    },
    {
        name: "Digestive Health",
        description: "Medicines for treating digestive issues, heartburn, and stomach problems",
        isOTC: true,
        images: ["https://images.unsplash.com/photo-1465101178521-c1a9136a3c5a"],
        isActive: true
    },
    {
        name: "Cardiovascular",
        description: "Prescription medications for heart and blood pressure management",
        isOTC: false,
        images: ["https://images.unsplash.com/photo-1505751172876-fa1923c5c528"],
        isActive: true
    },
    {
        name: "Diabetes Care",
        description: "Insulin and medications for diabetes management",
        isOTC: false,
        images: ["https://images.unsplash.com/photo-1514412076812-c097a5b1c7b7"],
        isActive: true
    },
    {
        name: "Skin Care",
        description: "Topical treatments for skin conditions, rashes, and dermatological issues",
        isOTC: true,
        images: ["https://images.unsplash.com/photo-1515378791036-0648a3ef77b2"],
        isActive: true
    },
    {
        name: "Allergy Relief",
        description: "Antihistamines and medications for seasonal and food allergies",
        isOTC: true,
        images: ["https://images.unsplash.com/photo-1465101046530-73398c7f28ca"],
        isActive: true
    },
    {
        name: "Eye Care",
        description: "Eye drops and medications for various eye conditions",
        isOTC: true,
        images: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb"],
        isActive: true
    },
    {
        name: "Mental Health",
        description: "Prescription medications for anxiety, depression, and mental health conditions",
        isOTC: false,
        images: ["https://images.unsplash.com/photo-1519864600265-abb23847ef2c"],
        isActive: true
    },
    {
        name: "Sleep Aids",
        description: "Medications to help with sleep disorders and insomnia",
        isOTC: true,
        images: ["https://images.unsplash.com/photo-1465101178521-c1a9136a3c5a"],
        isActive: true
    },
    {
        name: "Respiratory",
        description: "Inhalers and medications for asthma and breathing conditions",
        isOTC: false,
        images: ["https://images.unsplash.com/photo-1505751172876-fa1923c5c528"],
        isActive: true
    },
    {
        name: "Women's Health",
        description: "Medications specific to women's health needs",
        isOTC: true,
        images: ["https://images.unsplash.com/photo-1514412076812-c097a5b1c7b7"],
        isActive: true
    },
    {
        name: "Children's Medicine",
        description: "Safe and effective medications formulated for children",
        isOTC: true,
        images: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb"],
        isActive: true
    }
];

// Dummy data for subcategories (to be created after categories)
export const dummySubcategories = [
    // Pain Relief subcategories
    { name: "Headache Relief", description: "Fast-acting pain relief for headaches and migraines", categoryName: "Pain Relief", isOTC: true, images: ["https://images.unsplash.com/photo-1515378791036-0648a3ef77b2"] },
    { name: "Muscle Pain", description: "Topical and oral pain relief for muscle aches", categoryName: "Pain Relief", isOTC: true, images: ["https://images.unsplash.com/photo-1465101046530-73398c7f28ca"] },
    { name: "Joint Pain", description: "Anti-inflammatory medications for arthritis and joint pain", categoryName: "Pain Relief", isOTC: true, images: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb"] },

    // Antibiotics subcategories
    { name: "Penicillins", description: "Broad-spectrum antibiotics for bacterial infections", categoryName: "Antibiotics", isOTC: false, images: ["https://images.unsplash.com/photo-1465101178521-c1a9136a3c5a"] },
    { name: "Cephalosporins", description: "Beta-lactam antibiotics for various infections", categoryName: "Antibiotics", isOTC: false, images: ["https://images.unsplash.com/photo-1519864600265-abb23847ef2c"] },
    { name: "Macrolides", description: "Antibiotics for respiratory and skin infections", categoryName: "Antibiotics", isOTC: false, images: ["https://images.unsplash.com/photo-1505751172876-fa1923c5c528"] },

    // Vitamins & Supplements subcategories
    { name: "Multivitamins", description: "Complete daily vitamin and mineral supplements", categoryName: "Vitamins & Supplements", isOTC: true, images: ["https://images.unsplash.com/photo-1514412076812-c097a5b1c7b7"] },
    { name: "Vitamin D", description: "Supplements for bone health and immune support", categoryName: "Vitamins & Supplements", isOTC: true, images: ["https://images.unsplash.com/photo-1519864600265-abb23847ef2c"] },
    { name: "Omega-3 Fatty Acids", description: "Fish oil supplements for heart and brain health", categoryName: "Vitamins & Supplements", isOTC: true, images: ["https://images.unsplash.com/photo-1465101046530-73398c7f28ca"] },
    { name: "Probiotics", description: "Beneficial bacteria for digestive health", categoryName: "Vitamins & Supplements", isOTC: true, images: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb"] },

    // Cold & Flu subcategories
    { name: "Cough Suppressants", description: "Medications to reduce coughing", categoryName: "Cold & Flu", isOTC: true, images: ["https://images.unsplash.com/photo-1515378791036-0648a3ef77b2"] },
    { name: "Decongestants", description: "Nasal and sinus congestion relief", categoryName: "Cold & Flu", isOTC: true, images: ["https://images.unsplash.com/photo-1465101046530-73398c7f28ca"] },
    { name: "Fever Reducers", description: "Medications to lower body temperature", categoryName: "Cold & Flu", isOTC: true, images: ["https://images.unsplash.com/photo-1519864600265-abb23847ef2c"] },

    // Digestive Health subcategories
    { name: "Antacids", description: "Fast relief from heartburn and acid reflux", categoryName: "Digestive Health", isOTC: true, images: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb"] },
    { name: "Laxatives", description: "Treatments for constipation", categoryName: "Digestive Health", isOTC: true, images: ["https://images.unsplash.com/photo-1514412076812-c097a5b1c7b7"] },
    { name: "Anti-Diarrheal", description: "Medications to stop diarrhea", categoryName: "Digestive Health", isOTC: true, images: ["https://images.unsplash.com/photo-1519864600265-abb23847ef2c"] },

    // Cardiovascular subcategories
    { name: "ACE Inhibitors", description: "Blood pressure lowering medications", categoryName: "Cardiovascular", isOTC: false, images: ["https://images.unsplash.com/photo-1465101178521-c1a9136a3c5a"] },
    { name: "Beta Blockers", description: "Heart rate and blood pressure control", categoryName: "Cardiovascular", isOTC: false, images: ["https://images.unsplash.com/photo-1519864600265-abb23847ef2c"] },
    { name: "Statins", description: "Cholesterol-lowering medications", categoryName: "Cardiovascular", isOTC: false, images: ["https://images.unsplash.com/photo-1505751172876-fa1923c5c528"] },

    // Diabetes Care subcategories
    { name: "Rapid-Acting Insulin", description: "Fast-acting insulin for mealtime use", categoryName: "Diabetes Care", isOTC: false, images: ["https://images.unsplash.com/photo-1514412076812-c097a5b1c7b7"] },
    { name: "Long-Acting Insulin", description: "Extended duration insulin for basal coverage", categoryName: "Diabetes Care", isOTC: false, images: ["https://images.unsplash.com/photo-1519864600265-abb23847ef2c"] },
    { name: "Oral Hypoglycemics", description: "Pills to lower blood sugar levels", categoryName: "Diabetes Care", isOTC: false, images: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb"] },

    // Skin Care subcategories
    { name: "Acne Treatment", description: "Topical and oral medications for acne", categoryName: "Skin Care", isOTC: true, images: ["https://images.unsplash.com/photo-1515378791036-0648a3ef77b2"] },
    { name: "Eczema Relief", description: "Creams and ointments for eczema", categoryName: "Skin Care", isOTC: true, images: ["https://images.unsplash.com/photo-1465101046530-73398c7f28ca"] },
    { name: "Antifungal", description: "Treatments for fungal skin infections", categoryName: "Skin Care", isOTC: true, images: ["https://images.unsplash.com/photo-1519864600265-abb23847ef2c"] },

    // Allergy Relief subcategories
    { name: "Antihistamines", description: "Non-drowsy allergy relief", categoryName: "Allergy Relief", isOTC: true, images: ["https://images.unsplash.com/photo-1514412076812-c097a5b1c7b7"] },
    { name: "Nasal Sprays", description: "Steroid and saline nasal sprays for allergies", categoryName: "Allergy Relief", isOTC: true, images: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb"] },
];

// Dummy data for medicines (to be created after categories and subcategories)
export const dummyMedicines = [
    // Pain Relief medicines
    { name: "Ibuprofen 400mg", description: "Fast-acting pain and inflammation relief", manufacturer: "Pfizer", category: "Tablet", categoryName: "Pain Relief", subCategoryName: "Headache Relief", price: 8.99, stock: 150, batchNumber: "IBU001-2024", expiryDays: 730, isOTC: true, requiresPrescription: false, mrp: 10.99, purchasePrice: 7.99, uniqueIdentity: "IBU400-2024" },
    { name: "Acetaminophen 500mg", description: "Effective pain reliever and fever reducer", manufacturer: "Johnson & Johnson", category: "Tablet", categoryName: "Pain Relief", subCategoryName: "Headache Relief", price: 6.50, stock: 200, batchNumber: "ACT002-2024", expiryDays: 720, isOTC: true, requiresPrescription: false, mrp: 8.99, purchasePrice: 5.99, uniqueIdentity: "ACT500-2024" },
    { name: "Aspirin 325mg", description: "Pain relief and blood thinner", manufacturer: "Bayer", category: "Tablet", categoryName: "Pain Relief", subCategoryName: "Headache Relief", price: 5.99, stock: 180, batchNumber: "ASP003-2024", expiryDays: 700, isOTC: true, requiresPrescription: false, mrp: 7.99, purchasePrice: 4.99, uniqueIdentity: "ASP325-2024" },

    // Antibiotics medicines
    { name: "Amoxicillin 500mg", description: "Broad-spectrum antibiotic for bacterial infections", manufacturer: "GSK", category: "Capsule", categoryName: "Antibiotics", subCategoryName: "Penicillins", price: 15.50, stock: 80, batchNumber: "AMX004-2024", expiryDays: 540, isOTC: false, requiresPrescription: true, mrp: 18.99, purchasePrice: 13.99, uniqueIdentity: "AMX500-2024" },
    { name: "Azithromycin 250mg", description: "Macrolide antibiotic for respiratory infections", manufacturer: "Pfizer", category: "Tablet", categoryName: "Antibiotics", subCategoryName: "Macrolides", price: 22.00, stock: 60, batchNumber: "AZI005-2024", expiryDays: 600, isOTC: false, requiresPrescription: true, mrp: 25.99, purchasePrice: 19.99, uniqueIdentity: "AZI250-2024" },

    // Vitamins & Supplements
    { name: "Centrum Multivitamin", description: "Complete daily multivitamin supplement", manufacturer: "Pfizer", category: "Tablet", categoryName: "Vitamins & Supplements", subCategoryName: "Multivitamins", price: 18.99, stock: 120, batchNumber: "CEN006-2024", expiryDays: 900, isOTC: true, requiresPrescription: false, mrp: 21.99, purchasePrice: 16.99, uniqueIdentity: "CENMULTI-2024" },
    { name: "Vitamin D3 2000 IU", description: "Bone health and immune support", manufacturer: "Nature Made", category: "Capsule", categoryName: "Vitamins & Supplements", subCategoryName: "Vitamin D", price: 12.50, stock: 150, batchNumber: "VTD007-2024", expiryDays: 850, isOTC: true, requiresPrescription: false, mrp: 15.99, purchasePrice: 10.99, uniqueIdentity: "VITD3-2024" },
    { name: "Omega-3 Fish Oil 1000mg", description: "Heart and brain health support", manufacturer: "Nordic Naturals", category: "Capsule", categoryName: "Vitamins & Supplements", subCategoryName: "Omega-3 Fatty Acids", price: 25.99, stock: 90, batchNumber: "OMG008-2024", expiryDays: 730, isOTC: true, requiresPrescription: false, mrp: 29.99, purchasePrice: 22.99, uniqueIdentity: "OMG1000-2024" },

    // Cold & Flu medicines
    { name: "Robitussin Cough Syrup", description: "Cough suppressant and expectorant", manufacturer: "GSK", category: "Syrup", categoryName: "Cold & Flu", subCategoryName: "Cough Suppressants", price: 14.99, stock: 100, batchNumber: "ROB009-2024", expiryDays: 540, isOTC: true, requiresPrescription: false, mrp: 17.99, purchasePrice: 12.99, uniqueIdentity: "ROBCOUGH-2024" },
    { name: "Sudafed Decongestant 30mg", description: "Nasal congestion relief", manufacturer: "Johnson & Johnson", category: "Tablet", categoryName: "Cold & Flu", subCategoryName: "Decongestants", price: 9.99, stock: 140, batchNumber: "SUD010-2024", expiryDays: 600, isOTC: true, requiresPrescription: false, mrp: 12.99, purchasePrice: 8.99, uniqueIdentity: "SUD30-2024" },
    { name: "Tylenol Cold + Flu", description: "Multi-symptom cold and flu relief", manufacturer: "Johnson & Johnson", category: "Tablet", categoryName: "Cold & Flu", subCategoryName: "Fever Reducers", price: 11.50, stock: 110, batchNumber: "TYL011-2024", expiryDays: 650, isOTC: true, requiresPrescription: false, mrp: 14.99, purchasePrice: 9.99, uniqueIdentity: "TYLCF-2024" },

    // Digestive Health medicines
    { name: "Tums Antacid", description: "Fast heartburn and acid indigestion relief", manufacturer: "GSK", category: "Tablet", categoryName: "Digestive Health", subCategoryName: "Antacids", price: 7.99, stock: 160, batchNumber: "TUM012-2024", expiryDays: 700, isOTC: true, requiresPrescription: false, mrp: 9.99, purchasePrice: 6.99, uniqueIdentity: "TUMANT-2024" },
    { name: "Dulcolax Laxative", description: "Gentle relief from constipation", manufacturer: "Boehringer Ingelheim", category: "Tablet", categoryName: "Digestive Health", subCategoryName: "Laxatives", price: 10.50, stock: 85, batchNumber: "DUL013-2024", expiryDays: 680, isOTC: true, requiresPrescription: false, mrp: 13.99, purchasePrice: 9.99, uniqueIdentity: "DULLAX-2024" },
    { name: "Imodium A-D", description: "Anti-diarrheal medication", manufacturer: "Johnson & Johnson", category: "Capsule", categoryName: "Digestive Health", subCategoryName: "Anti-Diarrheal", price: 12.99, stock: 95, batchNumber: "IMO014-2024", expiryDays: 720, isOTC: true, requiresPrescription: false, mrp: 15.99, purchasePrice: 11.99, uniqueIdentity: "IMOAD-2024" },

    // Cardiovascular medicines
    { name: "Lisinopril 10mg", description: "ACE inhibitor for blood pressure control", manufacturer: "Merck", category: "Tablet", categoryName: "Cardiovascular", subCategoryName: "ACE Inhibitors", price: 18.00, stock: 70, batchNumber: "LIS015-2024", expiryDays: 540, isOTC: false, requiresPrescription: true, mrp: 21.99, purchasePrice: 16.99, uniqueIdentity: "LIS10-2024" },
    { name: "Metoprolol 50mg", description: "Beta blocker for heart conditions", manufacturer: "AstraZeneca", category: "Tablet", categoryName: "Cardiovascular", subCategoryName: "Beta Blockers", price: 20.50, stock: 65, batchNumber: "MET016-2024", expiryDays: 600, isOTC: false, requiresPrescription: true, mrp: 24.99, purchasePrice: 18.99, uniqueIdentity: "MET50-2024" },
    { name: "Atorvastatin 20mg", description: "Statin for cholesterol management", manufacturer: "Pfizer", category: "Tablet", categoryName: "Cardiovascular", subCategoryName: "Statins", price: 25.00, stock: 75, batchNumber: "ATO017-2024", expiryDays: 650, isOTC: false, requiresPrescription: true, mrp: 28.99, purchasePrice: 21.99, uniqueIdentity: "ATO20-2024" },

    // Diabetes Care medicines
    { name: "NovoRapid FlexPen", description: "Rapid-acting insulin for mealtime control", manufacturer: "Novo Nordisk", category: "Injection", categoryName: "Diabetes Care", subCategoryName: "Rapid-Acting Insulin", price: 85.00, stock: 40, batchNumber: "NOV018-2024", expiryDays: 365, isOTC: false, requiresPrescription: true, mrp: 99.99, purchasePrice: 79.99, uniqueIdentity: "NOVRAPID-2024" },
    { name: "Lantus SoloStar", description: "Long-acting basal insulin", manufacturer: "Sanofi", category: "Injection", categoryName: "Diabetes Care", subCategoryName: "Long-Acting Insulin", price: 95.00, stock: 35, batchNumber: "LAN019-2024", expiryDays: 365, isOTC: false, requiresPrescription: true, mrp: 110.99, purchasePrice: 85.99, uniqueIdentity: "LANTUS-2024" },
    { name: "Metformin 500mg", description: "Oral medication to lower blood sugar", manufacturer: "Bristol-Myers Squibb", category: "Tablet", categoryName: "Diabetes Care", subCategoryName: "Oral Hypoglycemics", price: 12.00, stock: 100, batchNumber: "MET020-2024", expiryDays: 720, isOTC: false, requiresPrescription: true, mrp: 15.99, purchasePrice: 10.99, uniqueIdentity: "MET500-2024" },

    // Skin Care medicines
    { name: "Benzoyl Peroxide 5% Gel", description: "Topical acne treatment", manufacturer: "Neutrogena", category: "Cream", categoryName: "Skin Care", subCategoryName: "Acne Treatment", price: 14.50, stock: 110, batchNumber: "BEN021-2024", expiryDays: 540, isOTC: true, requiresPrescription: false, mrp: 17.99, purchasePrice: 12.99, uniqueIdentity: "BENZ5-2024" },
    { name: "Hydrocortisone 1% Cream", description: "Anti-inflammatory for eczema and rashes", manufacturer: "Johnson & Johnson", category: "Cream", categoryName: "Skin Care", subCategoryName: "Eczema Relief", price: 8.99, stock: 130, batchNumber: "HYD022-2024", expiryDays: 600, isOTC: true, requiresPrescription: false, mrp: 11.99, purchasePrice: 7.99, uniqueIdentity: "HYD1-2024" },
    { name: "Clotrimazole Cream", description: "Antifungal treatment for skin infections", manufacturer: "Bayer", category: "Cream", categoryName: "Skin Care", subCategoryName: "Antifungal", price: 11.50, stock: 90, batchNumber: "CLO023-2024", expiryDays: 650, isOTC: true, requiresPrescription: false, mrp: 13.99, purchasePrice: 9.99, uniqueIdentity: "CLOCREAM-2024" },

    // Allergy Relief medicines
    { name: "Claritin 10mg", description: "24-hour non-drowsy allergy relief", manufacturer: "Bayer", category: "Tablet", categoryName: "Allergy Relief", subCategoryName: "Antihistamines", price: 16.99, stock: 125, batchNumber: "CLA024-2024", expiryDays: 730, isOTC: true, requiresPrescription: false, mrp: 19.99, purchasePrice: 14.99, uniqueIdentity: "CLA10-2024" },
    { name: "Flonase Nasal Spray", description: "Corticosteroid nasal spray for allergies", manufacturer: "GSK", category: "Drops", categoryName: "Allergy Relief", subCategoryName: "Nasal Sprays", price: 19.99, stock: 80, batchNumber: "FLO025-2024", expiryDays: 540, isOTC: true, requiresPrescription: false, mrp: 22.99, purchasePrice: 16.99, uniqueIdentity: "FLONASE-2024" },
];

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import SubCategory from '@/models/SubCategory';
import Medicine from '@/models/Medicine';
import { dummyCategories, dummySubcategories, dummyMedicines } from '@/lib/seedData';

export async function POST() {
    try {
        await connectDB();

        // Clear existing data
        await Category.deleteMany({});
        await SubCategory.deleteMany({});
        await Medicine.deleteMany({});

        // Insert categories
        const categories = await Category.insertMany(dummyCategories);
        console.log(`✅ Inserted ${categories.length} categories`);

        // Create a map of category names to IDs
        const categoryMap = new Map();
        categories.forEach(cat => {
            categoryMap.set(cat.name, cat._id);
        });

        // Insert subcategories with proper categoryId references
        const subcategoriesWithIds = dummySubcategories.map(sub => ({
            name: sub.name,
            description: sub.description,
            categoryId: categoryMap.get(sub.categoryName),
            isOTC: sub.isOTC,
            isActive: true,
        }));

        const subcategories = await SubCategory.insertMany(subcategoriesWithIds);
        console.log(`✅ Inserted ${subcategories.length} subcategories`);

        // Create a map of subcategory names to IDs
        const subcategoryMap = new Map();
        subcategories.forEach(sub => {
            subcategoryMap.set(sub.name, sub._id);
        });

        // Insert medicines with proper categoryId and subCategoryId references
        // Convert seed prices to INR using a factor (≈ USD→INR)
        const USD_TO_INR = 83;
        const medicinesWithIds = dummyMedicines.map((med, idx) => {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + med.expiryDays);

            // Default composition, images, highlights, relatedProducts, rating
            const defaultComposition = [
                { name: 'Paracetamol', value: '500mg' },
                { name: 'Caffeine', value: '50mg' }
            ];
            // Use Wikimedia/Unsplash real medicine images for demo
            const medicineImageMap: Record<string, string> = {
                'Ibuprofen 400mg': 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Ibuprofen_400mg_tablets.jpg',
                'Acetaminophen 500mg': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Paracetamol-tablets.jpg',
                'Aspirin 325mg': 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Aspirin_tablets.jpg',
                'Amoxicillin 500mg': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Amoxicillin_capsules.jpg',
                'Azithromycin 250mg': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Azithromycin_tablets.jpg',
                'Centrum Multivitamin': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Multivitamin_tablets.jpg',
                'Vitamin D3 2000 IU': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Vitamin_D3_capsules.jpg',
                'Omega-3 Fish Oil 1000mg': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Fish_oil_capsules.jpg',
                'Robitussin Cough Syrup': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Cough_syrup.jpg',
                'Sudafed Decongestant 30mg': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Sudafed_tablets.jpg',
                'Tylenol Cold + Flu': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Tylenol_tablets.jpg',
                'Tums Antacid': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Tums_tablets.jpg',
                'Dulcolax Laxative': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Dulcolax_tablets.jpg',
                'Imodium A-D': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Imodium_capsules.jpg',
                'Lisinopril 10mg': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Lisinopril_tablets.jpg',
                'Metoprolol 50mg': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Metoprolol_tablets.jpg',
                'Atorvastatin 20mg': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Atorvastatin_tablets.jpg',
                'NovoRapid FlexPen': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Insulin_pen.jpg',
                'Lantus SoloStar': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Insulin_pen.jpg',
                'Metformin 500mg': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Metformin_tablets.jpg',
                'Benzoyl Peroxide 5% Gel': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Benzoyl_peroxide_gel.jpg',
                'Hydrocortisone 1% Cream': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Hydrocortisone_cream.jpg',
                'Clotrimazole Cream': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Clotrimazole_cream.jpg',
                'Claritin 10mg': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Claritin_tablets.jpg',
                'Flonase Nasal Spray': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Nasal_spray.jpg',
            };
            const defaultImages = [medicineImageMap[med.name] || 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Ibuprofen_400mg_tablets.jpg'];
            const defaultHighlights = [
                'Fast relief',
                'OTC available',
                'Doctor recommended'
            ];
            return {
                name: med.name,
                description: med.description,
                manufacturer: med.manufacturer,
                category: med.category,
                categoryId: categoryMap.get(med.categoryName),
                subCategoryId: subcategoryMap.get(med.subCategoryName),
                price: Math.round((med.price * USD_TO_INR) * 100) / 100,
                stock: med.stock,
                expiryDate: expiryDate,
                batchNumber: med.batchNumber,
                isOTC: med.isOTC,
                isPrescription: med.requiresPrescription,
                isActive: true,
                composition: defaultComposition,
                images: defaultImages,
                highlights: defaultHighlights,
                relatedProducts: [],
                rating: { average: 4.5, count: 10 },
            };
        });

        const medicines = await Medicine.insertMany(medicinesWithIds);
        console.log(`✅ Inserted ${medicines.length} medicines`);

        return NextResponse.json({
            success: true,
            message: 'Dummy data seeded successfully',
            data: {
                categories: categories.length,
                subcategories: subcategories.length,
                medicines: medicines.length,
            },
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

import mongoose, { Document, Schema } from 'mongoose';

export interface IPrescription extends Document {
    patientName: string;
    patientAge: number;
    doctorName: string;
    medicines: Array<{
        medicineId: mongoose.Types.ObjectId;
        medicineName: string;
        dosage: string;
        frequency: string;
        duration: string;
    }>;
    dateIssued: Date;
    status: 'pending' | 'dispensed' | 'cancelled';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PrescriptionSchema = new Schema<IPrescription>({
    patientName: {
        type: String,
        required: [true, 'Please provide patient name'],
        maxlength: [100, 'Patient name cannot be more than 100 characters'],
    },
    patientAge: {
        type: Number,
        required: [true, 'Please provide patient age'],
        min: [0, 'Age cannot be negative'],
        max: [150, 'Age cannot be more than 150'],
    },
    doctorName: {
        type: String,
        required: [true, 'Please provide doctor name'],
        maxlength: [100, 'Doctor name cannot be more than 100 characters'],
    },
    medicines: [{
        medicineId: {
            type: Schema.Types.ObjectId,
            ref: 'Medicine',
            required: true,
        },
        medicineName: {
            type: String,
            required: true,
        },
        dosage: {
            type: String,
            required: [true, 'Please provide dosage'],
        },
        frequency: {
            type: String,
            required: [true, 'Please provide frequency'],
        },
        duration: {
            type: String,
            required: [true, 'Please provide duration'],
        },
    }],
    dateIssued: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending', 'dispensed', 'cancelled'],
        default: 'pending',
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot be more than 500 characters'],
    },
}, {
    timestamps: true,
});

export default mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
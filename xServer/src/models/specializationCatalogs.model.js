import mongoose, { Schema } from "mongoose";

const specializationCatalogsSchema = new Schema(
    {
        specializationCatalogs: [{
            name: {
                type: String,
                required: true
            },
            specializationIds: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'Specialization'  // Specialization.createdBy se mentor (CommonUser) milega
                }
            ]
        }]
    }
)
const SpecializationCatalog = mongoose.model('SpecializationCatalog',specializationCatalogsSchema)
export default SpecializationCatalog;
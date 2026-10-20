import mongoose from 'mongoose';

const applianceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an appliance name'],
      trim: true,
    },
    room: {
      type: String,
      required: [true, 'Please specify the room'],
      trim: true,
      default: 'Living Room',
    },
    type: {
      type: String,
      required: [true, 'Please specify the appliance type'],
      enum: ['light', 'ac', 'fan', 'geyser', 'tv', 'heater', 'speaker', 'other'],
      default: 'light',
    },
    status: {
      type: Boolean,
      default: false,
    },
    powerUsage: {
      type: Number,
      required: [true, 'Please specify power consumption in Watts'],
      min: [0, 'Power usage cannot be negative'],
      default: 50,
    },
    ratedPower: {
      type: Number,
      min: [0, 'Rated power cannot be negative'],
      default: function () {
        return this.powerUsage || 50;
      },
    },
    currentPower: {
      type: Number,
      min: [0, 'Current power cannot be negative'],
      default: function () {
        return this.status ? (this.ratedPower || this.powerUsage || 50) : 0;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure ratedPower and currentPower defaults are populated
applianceSchema.pre('save', function (next) {
  if (this.ratedPower === undefined || this.ratedPower === null) {
    this.ratedPower = this.powerUsage || 50;
  }
  if (this.status) {
    if (this.currentPower === undefined || this.currentPower === null || this.currentPower === 0) {
      this.currentPower = this.ratedPower;
    }
  } else {
    this.currentPower = 0;
  }
  next();
});

const Appliance = mongoose.model('Appliance', applianceSchema);

export default Appliance;

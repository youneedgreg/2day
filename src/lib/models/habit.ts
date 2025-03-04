import mongoose, { Schema } from "mongoose"

const HabitSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  type: {
    type: String,
    enum: ["build", "quit"],
    required: true,
  },
  frequency: {
    type: [String],
    enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    default: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
  },
  streak: {
    type: Number,
    default: 0,
  },
  completedDates: [
    {
      type: Date,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export const Habit = mongoose.models.Habit || mongoose.model("Habit", HabitSchema)


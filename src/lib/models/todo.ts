import mongoose, { Schema } from "mongoose"

const TodoSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  dueDate: {
    type: Date,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  reminder: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export const Todo = mongoose.models.Todo || mongoose.model("Todo", TodoSchema)


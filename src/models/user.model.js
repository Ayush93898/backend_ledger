const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required for creating a user"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
        "Please enter a valid email address",
      ],
      unique: [true, "Email already exist"],
    },
    name: {
      type: String,
      required: [true, "Name is required for creating an account"],
    },
    password: {
      type: String,
      required: [true, "Password is required for creating an account"],
      minlength: [6, "password should contain more than 6 character"],
      select: false, // means the password field won't be returned in query results by default. (explicitly humko password mangwana hoga)
    },
    systemUser:{ // jiske pass db control hoga wo hi systemUser true kae sakega
      type:Boolean,
      default:false, 
      immutable:true,
      select:false
    }
  },
  { timestamps: true },
);

// pre save hook
// runs automatically before saving a user to MongoDb,
// it hash the password if the password was modified
// next -> is like callback that tells mongoose "i am done, now proceed to save"
// and always use function instead of arrow fn , bcz this refers to the current document - arrow fn dont have their own this

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next;
  this.password = await bcrypt.hash(this.password, 10);
  return next;
});

// it compares the plain text passowrd (entered by the user) with the hashed passowrd store in DB
// but ye toh hum controller me karte hai, haina? -> as its not manditory , but its a best bcz of
// seperation of concerns- pass logic belogs to the User model, not the controller
// controller should only have handle req/res

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;


import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { Listing } from "../models/listing.models.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";

const createNewListing = asyncHandler(async (req, res) => {
    //get data from req body
    //validate data
    //check listing uniqueness if required
    //check for images
    //upload them to cloudinary
    //create listing in db
    //check for creation success
    //return response


    if(!req.user){
        throw new ApiError(401, "Unauthorized");
    }

    if(req?.user?.role !== "donor"){
        throw new ApiError(403, "Only donors can create listings");
    }

    const { title, description, quantity, pickupAddress, expiryDate, status } = req.body;

    if(
        [ title, description, quantity, pickupAddress, expiryDate ].some((field) => field.trim()==="")
    ){
        throw new ApiError(400, "All fields are required");
    }

    const donorId = req.user?._id;
    const foodPhotoLocalPath = req.file?.path;
    if(!foodPhotoLocalPath){
        throw new ApiError(400, "Food photo is required");
    }

    const foodPhoto = await uploadToCloudinary(foodPhotoLocalPath, "food_photos");

    if(!foodPhoto){
        throw new ApiError(500, "Something went wrong while uploading food photo");
    }

    const listing = await Listing.create({
        title,
        description,
        quantity,
        foodPhoto: foodPhoto?.url || "",
        donorId,
        pickupAddress,
        expiryDate,
        status
    });

    if(!listing){
        throw new ApiError(500, "Something went wrong while creating listing");
    }

    const user = await User.findById(donorId);
    if(user){
        user.listings.push(listing._id);
        await user.save();
    }
    
    return res
        .status(201)
        .json(new ApiResponse(200, listing, "Listing created successfully"));
});



export { createNewListing };
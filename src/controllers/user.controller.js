import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js";
import { uploadToCloudinary,deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccressAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });


        return { accessToken, refreshToken };

    } catch (err) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens");
    }
};

const registerUser = asyncHandler(async (req, res) => {

    // get user details from frontend
    // validation - not empty
    // check if user already exists - email unique
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refreshToken from response
    // check for user creation
    // return res

    const { email, username, password, role, phone } = req.body;
    // console.log(req.body);

    if (
        [email, username, password, role, phone].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        throw new ApiError(409, "User with given email or username already exists");
    }
    // console.log(req.files)

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    const avatar = await uploadToCloudinary(avatarLocalPath);
    const coverImage = await uploadToCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Error while uploading avatar image");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        role,
        phone
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
});

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password match
    // access token and refresh token
    // send cookies

    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{ email }, { username: username?.toLowerCase() }]
    })

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccressAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).
        select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        )
});

const logoutUser = asyncHandler(async (req, res) => {
    // clear cookies
    // find user from req.user we get from verifyJWT

    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized access");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token - user not found");
        }

        if (user?.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccressAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    //check if oldPassword and newPassword are provided

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    if( oldPassword === newPassword ){
        throw new ApiError(400, "New password must be different from old password");
    }

    const user = await User.findById(req.user?._id);

    const isOldPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isOldPasswordCorrect) {
        throw new ApiError(400, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const currentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
    // update user details like username, phone etc
    // return updated user

    const { username, phone } = req.body;

    if( !username && !phone ){
        throw new ApiError(400, "At least one field is required to update");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                username: username?.toLowerCase(),
                phone: phone?.trim()
            }
        },
        {
            new: true
        }
    );

    if (!user) {
        throw new ApiError(500, "Something went wrong while updating user details");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User details updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
    // upload new avatar to cloudinary
    // update user document with new avatar url
    // return updated user

    const avatarLocalPath = req.file?.path;

    const oldImageUrl = req.user?.avatar;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    const avatar = await uploadToCloudinary(avatarLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Error while uploading avatar image");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password");

    if (!user) {
        throw new ApiError(500, "Something went wrong while updating avatar");
    }

    // delete old avatar from cloudinary

    if (oldImageUrl) {
        await deleteFromCloudinary(oldImageUrl);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
    // upload new cover image to cloudinary
    // update user document with new cover image url
    // return updated user

    const coverImageLocalPath = req.file?.path;
    const oldImageUrl = req.user?.coverImage;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is required");
    }

    const coverImage = await uploadToCloudinary(coverImageLocalPath);

    if (!coverImage) {
        throw new ApiError(400, "Error while uploading cover image");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password");

    if (!user) {
        throw new ApiError(500, "Something went wrong while updating cover image");
    }

    if (oldImageUrl) {
        await deleteFromCloudinary(oldImageUrl);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const deleteUser = asyncHandler(async (req, res) => {
    // delete user by id from req.user

    const avatarUrl = req.user?.avatar;
    const coverImageUrl = req.user?.coverImage;

    if( avatarUrl ){
        await deleteFromCloudinary(avatarUrl);
    }
    if( coverImageUrl ){
        await deleteFromCloudinary(coverImageUrl);
    }
    
    await User.findByIdAndDelete(req.user._id);
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "User deleted successfully"));
});


export { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, updateUserDetails, currentUser, updateAvatar, updateCoverImage, deleteUser };
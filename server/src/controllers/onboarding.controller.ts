import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { HTTP_STATUS } from '../constants';

/**
 * Get Onboarding State & Profile Information
 */
export const getOnboardingState = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const user = await User.findById(userId).populate('relationshipId', 'name type coverUrl partner1 partner2');
  if (!user) {
    throw new AppError('User account not found.', HTTP_STATUS.NOT_FOUND);
  }

  return ApiResponse.success(res, 'Onboarding state retrieved', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      birthday: user.birthday,
      username: user.username,
      phone: user.phone,
      gender: user.gender,
      relationshipId: user.relationshipId,
      enabledFeatures: user.enabledFeatures || [],
      onboardingCompleted: user.onboardingCompleted,
    },
  });
});

/**
 * Update Profile Details during Onboarding (PATCH /api/v1/onboarding/profile)
 * Zero-Trust: Never allows client to modify relationshipId, role, or enabledFeatures
 */
export const updateProfileDetails = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const { name, bio, birthday, avatar, username, phone, gender } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User account not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (name && name.trim()) user.name = name.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (birthday) {
    user.birthday = new Date(birthday);
    try {
      const dobDate = new Date(birthday);
      const today = new Date();
      let nextBday = new Date(today.getFullYear(), dobDate.getMonth(), dobDate.getDate());
      if (nextBday < today) {
        nextBday.setFullYear(today.getFullYear() + 1);
      }

      const { Countdown } = await import('../models/lifeExperience.model');
      await Countdown.create({
        relationshipId: user.relationshipId ? user.relationshipId.toString() : 'AFZAL_AMRIN_AFRIN_VERSE',
        createdBy: user._id,
        title: `🎂 ${user.name}'s Birthday`,
        targetDate: nextBday,
        type: 'BIRTHDAY',
      }).catch(() => {});

      const { createActivity } = await import('./activity.controller');
      await createActivity(
        user._id.toString(),
        'BIRTHDAY_REMINDER',
        undefined,
        undefined,
        `🎂 ${user.name}'s Birthday Added!`,
        `Born on ${dobDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
      ).catch(() => {});
    } catch (_e) {}
  }
  if (avatar !== undefined) user.avatar = avatar;
  if (username !== undefined) user.username = username.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (gender !== undefined) user.gender = gender.trim();

  // Explicitly protect relationshipId, role, enabledFeatures from client manipulation
  await user.save();

  return ApiResponse.success(res, 'Profile details updated successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      birthday: user.birthday,
      username: user.username,
      relationshipId: user.relationshipId,
      enabledFeatures: user.enabledFeatures || [],
      onboardingCompleted: user.onboardingCompleted,
    },
  });
});

/**
 * Complete Onboarding (POST /api/v1/onboarding/complete)
 */
export const completeOnboarding = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User account not found.', HTTP_STATUS.NOT_FOUND);
  }

  user.onboardingCompleted = true;
  await user.save();

  return ApiResponse.success(res, 'Welcome to Couple Universe! Onboarding completed ❤️', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      birthday: user.birthday,
      relationshipId: user.relationshipId,
      enabledFeatures: user.enabledFeatures || [],
      onboardingCompleted: true,
    },
  });
});

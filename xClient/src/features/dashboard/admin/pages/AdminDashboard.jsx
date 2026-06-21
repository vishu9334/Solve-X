import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useGetAdminProfile, adminProfile } from "../hooks/adminprofile.hook";

const AdminDashboard = () => {
  const { data: profileResponse, isLoading, isError, error } = useGetAdminProfile();
  const { mutate: updateProfile, isPending } = adminProfile();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      bio: "",
    },
  });
   
  useEffect(() => {
    if (profileResponse?.data?.bio) {
      reset({ bio: profileResponse.data.bio });
    }
  }, [profileResponse?.data?.bio, reset]);

  if (isLoading) return <div>Loading profile...</div>;
  if (isError) return <div>Error loading profile: {error?.message}</div>;

  const profileData = profileResponse?.data || {};

  const onSubmit = (data) => {
    updateProfile({ bio: data.bio });
  };

  return (
    <div>
      <h2>Admin Profile</h2>
      <div>
        <p><strong>Name:</strong> {profileData.name}</p>
        <p><strong>Username:</strong> {profileData.username}</p>
        <p><strong>Email:</strong> {profileData.email}</p>
        <p><strong>Role:</strong> {profileData.role}</p>
        <p><strong>Avatar:</strong> {profileData.avatar ? <img src={profileData.avatar} alt="Avatar" width="50" /> : 'No avatar'}</p>
        <p><strong>Bio:</strong> {profileData.bio}</p>
      </div>

      <hr />

      <h3>Update Bio</h3>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="bio">Bio: </label>
          <textarea
            id="bio"
            {...register("bio")}
            rows="4"
            cols="50"
          />
        </div>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Updating...' : 'Update Bio'}
        </button>
      </form>
    </div>
  );
};

export default AdminDashboard;

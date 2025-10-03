import { useUser } from "../contexts/UserContext";
import Detail from "../components/profile/UserDetailListItem";
import { useEffect, useState } from "react";

const UserDetails = () => {
  const { user } = useUser();
  console.log(user);

  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("profileImage");
    if (saved) setProfileImage(saved);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setProfileImage(result);
      if (result) localStorage.setItem("profileImage", result);
    };
    reader.readAsDataURL(file);
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase()).join("");
    return initials || name[0]?.toUpperCase() || "";
  };

  const userDetails = [
    { label: "User No", value: user.Userno },
    { label: "Name", value: user.Name },
    { label: "Designation", value: user.Designation },
    { label: "Telephone No", value: user.TelephoneNo },
    { label: "NIC No", value: user.NIC_no },
    { label: "Salary Scale", value: user.salary_scale },
    { label: "Private Address", value: user.Private_Addr },
    { label: "Email", value: user.Email },
    { label: "VIP Status", value: user.Vip },
  ];
  return (
    <div className="w-4/5 ">
      <div className="flex justify-center items-center bg-white px-4 mb-12">
        <div className="border border-gray-200 shadow rounded-xl max-w-4xl w-full p-10 flex flex-col justify-center mt-5">
          <div className="w-full flex justify-start items-center gap-10 mb-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 px-5 py-4 rounded-xl">
            {profileImage ? (
              <img
                src={profileImage}
                alt="profile"
                width={150}
                height={150}
                className="rounded-full ring-4 ring-white object-cover"
              />
            ) : (
              <div
                style={{ width: 150, height: 150 }}
                className="rounded-full ring-4 ring-gray-200 bg-gray-100 text-gray-600 flex items-center justify-center text-4xl font-bold"
              >
                {getInitials(user?.Name)}
              </div>
            )}
            <div className="flex flex-col">
              <h3 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                {user.Name}
              </h3>
              <div className="mt-3">
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="profile-upload"
                  className="inline-block bg-white text-[#7A0000] px-3 py-1.5 text-xs font-medium rounded cursor-pointer hover:brightness-95"
                >
                  Change Photo
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 w-full">
            {userDetails.map((item, index) => (
              <Detail
                key={index}
                label={item.label}
                value={item.value}
                className={index % 2 === 0 ? "bg-white" : "bg-white"}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;

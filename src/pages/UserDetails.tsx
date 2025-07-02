import { useUser } from "../contexts/UserContext";
import Detail from "../components/profile/UserDetailListItem";
import ProfileImage from "../assets/profile_image3.jpg";

const UserDetails = () => {
  const { user } = useUser();
  console.log(user);

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
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-tr from-[#f9fafb] to-[#e5e7eb] px-4 mb-12">
        <div className="backdrop-blur-md  border border-gray-200 shadow-2xl rounded-3xl max-w-4xl w-full p-10 flex flex-col justify-center mt-5">
          <div className="w-full flex justify-start items-center gap-10  mb-14 bg-amber-300 px-5">
            <img
              src={ProfileImage}
              alt="profile image"
              width={150}
              height={150}
              className="rounded-full -mb-12"
            />
            <h3 className="text-3xl font-extrabold text-gray-800 tracking-tight flex">
              {user.Name}
            </h3>
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

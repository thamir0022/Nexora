import CustomInput from "@/components/CustomInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signUpFields } from "@/constants/inputFields";
import React, { useState } from "react";
import { Link } from "react-router-dom";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  console.log(formData);

  return (
    <Card className="w-2/3">
      <CardHeader/>
      <CardContent>
        <form className="flex flex-col gap-4">
          {signUpFields.map(({ id, label, name, placeHolder, type }) => (
            <CustomInput
              id={id}
              label={label}
              name={name}
              placeHolder={placeHolder}
              type={type}
              onChange={handleInputChange}
            />
          ))}
          <Button>Create Account</Button>
        </form>
      </CardContent>
      <CardFooter className="place-content-center">
        <p>Already have an account? <Link className="link" to="/sign-in">Sign In</Link></p>
      </CardFooter>
    </Card>
  );
};

export default SignUpPage;

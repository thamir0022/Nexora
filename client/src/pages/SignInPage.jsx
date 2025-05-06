import CustomInput from "@/components/CustomInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInFields } from "@/constants/inputFields";
import React, { useState } from "react";
import { Link } from "react-router-dom";

const SignInPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  console.log(formData);

  return (
    <Card className="w-2/3">
      <CardHeader />
      <CardContent>
        <form className="flex flex-col gap-4">
          {signInFields.map(({ id, label, name, placeHolder, type }) => (
            <CustomInput
              id={id}
              label={label}
              name={name}
              placeHolder={placeHolder}
              type={type}
              onChange={handleInputChange}
            />
          ))}
          <Button>Sign In</Button>
        </form>
      </CardContent>
      <CardFooter className="place-content-center">
        <p>
          Don't have an account?{" "}
          <Link className="link" to="/sign-up">
            Sign Up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};

export default SignInPage;

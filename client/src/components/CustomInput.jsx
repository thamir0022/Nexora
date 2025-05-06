import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const CustomInput = ({ id, label, type, placeHolder, name, value, onChange, ...props }) => {
  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        name={name}
        placeholder={placeHolder}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  );
};

export default CustomInput;

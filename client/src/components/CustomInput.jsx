import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "./ui/textarea";

const CustomInput = ({
  id,
  label,
  type = "text",
  placeHolder,
  name,
  value,
  onChange,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={id}>{label}</Label>
      {type === "textarea" ? (
        <Textarea
          id={id}
          type={type}
          name={name}
          placeholder={placeHolder}
          value={value}
          onChange={onChange}
          {...props}
        />
      ) : (
        <Input
          id={id}
          type={type}
          name={name}
          placeholder={placeHolder}
          value={value}
          onChange={onChange}
          {...props}
        />
      )}
    </div>
  );
};

export default CustomInput;

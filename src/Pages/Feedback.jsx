import { Spinner, Input, Textarea, Select, useToast } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../Components/Layout/AppShell";
import { sendFeedback } from "../Services/ExtraApi";
import { getStoredUser } from "../Services/session";

const Feedback = () => {
  const navigator = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("");

  const feedbackTypes = [
    "Report a bug",
    "Course Enrolment",
    "Suggest Improvement",
    "Request a feature",
    "Course content",
    "Others",
  ];

  useEffect(() => {
    if (!getStoredUser()?.token) {
      navigator("/login");
    }
  }, [navigator]);

  const onSubmit = () => {
    if (!type || !phone.trim() || !message.trim()) {
      toast({
        title: "Please fill in all fields",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    setIsLoading(true);
    sendFeedback({ type, phone: phone.trim(), message: message.trim() })
      .then((res) => {
        if (res.status) {
          toast({
            title: "Feedback sent successfully",
            status: "success",
            duration: 4000,
          });
          setPhone("");
          setMessage("");
          setType("");
        } else {
          toast({
            title: res.response?.message || "Failed to send feedback",
            status: "error",
            duration: 4000,
          });
        }
      })
      .catch(() =>
        toast({ title: "Failed to send feedback", status: "error" })
      )
      .finally(() => setIsLoading(false));
  };

  return (
    <AppShell active={{ feedback: true }} title="Feedback" subtitle="We'd love to hear from you">
      {isLoading ? (
        <div className="text-center py-20">
          <Spinner size="xl" color="brand.500" />
        </div>
      ) : (
        <div className="max-w-xl space-y-4 msl-card p-6">
          <div className="grid sm:grid-cols-2 gap-3">
            <Select
              placeholder="Select type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {feedbackTypes.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Textarea
            placeholder="Message"
            height="200px"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="button" className="msl-btn-primary w-full py-3" onClick={onSubmit}>
            Send feedback
          </button>
        </div>
      )}
    </AppShell>
  );
};

export default Feedback;

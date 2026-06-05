import { generateQRCode, windowsLogin } from "../Services/UserApi";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { currentVersion } from "../version";
import { clearSession, getOrCreateDeviceId, setStoredUser } from "../Services/session";

const Login = () => {
  const navigator = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const pollRef = useRef(null);
  const codeIdRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState();

  const deviceId = getOrCreateDeviceId();
  const payload = {
    device_id: deviceId,
    device_name: "MSL Desktop",
    device_meta: typeof navigator !== "undefined" ? navigator.userAgent : "Electron",
  };

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    const codeId = codeIdRef.current;
    if (!codeId) return;

    pollRef.current = setInterval(() => {
      windowsLogin(codeId).then((response) => {
        if (response.status && response.response?.response) {
          const user = response.response.response;
          setStoredUser({
            ...user,
            token: user.token,
            device_id: user.device_id || deviceId,
          });
          stopPolling();
          onClose();
          navigator("/");
        }
      });
    }, 1000);
  }, [deviceId, navigator, onClose, stopPolling]);

  const handleModalClose = () => {
    stopPolling();
    onClose();
  };

  const genCode = () => {
    setIsLoading(true);
    generateQRCode(payload)
      .then((res) => {
        setIsLoading(false);
        const data = res.response?.response;
        if (!data?._id) return;
        setCode(data);
        codeIdRef.current = data._id;
        onOpen();
      })
      .catch((error) => {
        console.log("generateQRCode error :>> ", error);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    clearSession();
    return () => stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    if (isOpen) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [isOpen, startPolling, stopPolling]);

  return (
    <div className="min-h-screen bg-msl-bg flex items-center justify-center p-6">
      {isLoading ? (
        <Spinner size="xl" thickness="4px" color="brand.500" />
      ) : (
        <div className="w-full max-w-md">
          <div className="msl-card-elevated p-8 text-center">
            <img
              className="w-28 mx-auto object-contain"
              src="https://mslelearning.com/mslogo.png"
              alt="MSL"
            />
            <h1 className="text-2xl font-bold text-msl-text mt-6">Welcome back</h1>
            <p className="text-sm text-msl-muted mt-2">
              Sign in with your MSL mobile app
            </p>
            <ol className="text-left text-sm text-msl-muted space-y-2 mt-6 list-decimal list-inside">
              <li>Open your mobile app</li>
              <li>Visit the Menu tab</li>
              <li>Tap Windows App Login</li>
              <li>Scan the generated code</li>
            </ol>
            <button
              type="button"
              onClick={() => genCode()}
              className="msl-btn-primary w-full mt-8 py-3"
            >
              Generate login code
            </button>
          </div>
          <p className="text-center text-msl-warning text-sm font-medium mt-4">
            You need the mobile app to sign in
          </p>
          <p className="text-center text-msl-muted text-sm mt-2">
            Version {currentVersion}
          </p>
        </div>
      )}
      <Modal isOpen={isOpen} onClose={handleModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Scan with your Mobile App</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <div className="m-auto my-10 w-fit text-center">
              <QRCodeSVG value={code?.code} />
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};
export default Login;

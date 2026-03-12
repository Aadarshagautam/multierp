import { useState, useEffect, useCallback } from "react";
import api from "../lib/api.js";
import AppContext from "./app-context.js";

export const AppContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
    const [isLoggedin, setIsLoggedinState] = useState(() => {
        return localStorage.getItem("isLoggedin") === "true";
    });
    const [userData, setUserData] = useState(null);
    const [currentOrgId, setCurrentOrgId] = useState(null);
    const [currentOrgName, setCurrentOrgName] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userPermissions, setUserPermissions] = useState([]);
    const [orgBusinessType, setOrgBusinessType] = useState("general");
    const [orgSoftwarePlan, setOrgSoftwarePlan] = useState("single-branch");
    const [branchId, setBranchId] = useState(null);
    const [branchName, setBranchName] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

    const setIsLoggedin = (value) => {
        setIsLoggedinState(value);
        localStorage.setItem("isLoggedin", value ? "true" : "false");
    };

    const clearWorkspaceState = useCallback(() => {
      setUserData(null);
      setCurrentOrgId(null);
      setCurrentOrgName(null);
      setUserRole(null);
      setUserPermissions([]);
      setOrgBusinessType("general");
      setOrgSoftwarePlan("single-branch");
      setBranchId(null);
      setBranchName(null);
    }, []);

    const getUserData = useCallback(async () => {
      try {
        const { data } = await api.get("/user/data");

        if (data.success) {
          const user = data.data || null;
          setUserData(user);
          setIsLoggedin(true);
          setCurrentOrgId(user?.orgId || null);
          setCurrentOrgName(user?.orgName || null);
          setUserRole(user?.role || null);
          setUserPermissions(user?.permissions || []);
          setOrgBusinessType(user?.orgBusinessType || "general");
          setOrgSoftwarePlan(user?.orgSoftwarePlan || "single-branch");
          setBranchId(user?.branchId || null);
          setBranchName(user?.branchName || null);
        } else {
          setIsLoggedin(false);
          clearWorkspaceState();
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setIsLoggedin(false);
          clearWorkspaceState();
        }
      }
    }, [clearWorkspaceState]);

    const getAuthState = useCallback(async () => {
        try {
          const { data } = await api.get("/auth/is-auth");
      
          if (data.success) {
            setIsLoggedin(true);
            setCurrentOrgId(data.data?.orgId || null);
            setCurrentOrgName(data.data?.orgName || null);
            setOrgBusinessType(data.data?.orgBusinessType || "general");
            setOrgSoftwarePlan(data.data?.orgSoftwarePlan || "single-branch");
            setBranchId(data.data?.branchId || null);
            setBranchName(data.data?.branchName || null);
            await getUserData();
          } else {
            setIsLoggedin(false);
            clearWorkspaceState();
          }
        } catch (error) {
          if (error.response?.status === 401) {
            setIsLoggedin(false);
            clearWorkspaceState();
          }
        } finally {
          setHasCheckedAuth(true);
          setLoading(false);
        }
      }, [clearWorkspaceState, getUserData]);

    const hasPermission = useCallback((required) => {
      if (!required) return true;
      if (userPermissions.includes("*")) return true;
      if (userPermissions.includes(required)) return true;

      const segments = String(required || "").split(".").filter(Boolean);

      for (let index = segments.length - 1; index > 0; index -= 1) {
        if (userPermissions.includes(`${segments.slice(0, index).join(".")}.*`)) {
          return true;
        }
      }

      if (segments.length > 2) {
        const rootActionPermission = `${segments[0]}.${segments[segments.length - 1]}`;
        if (userPermissions.includes(rootActionPermission)) return true;
      }

      return false;
    }, [userPermissions]);

    useEffect(() => {
        getAuthState();
    }, [getAuthState])

    const value = {
        backendUrl,
        isLoggedin,
        userData,
        setIsLoggedin,
        getUserData,
        setUserData,
        currentOrgId,
        setCurrentOrgId,
        currentOrgName,
        setCurrentOrgName,
        loading,
        hasCheckedAuth,
        userRole,
        userPermissions,
        hasPermission,
        orgBusinessType,
        setOrgBusinessType,
        orgSoftwarePlan,
        branchId,
        branchName,
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};

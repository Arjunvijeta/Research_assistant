import { useState, useEffect } from "react";
import { chatApi } from "../services/api";

export const useApiHealth = () => {
  const [isHealthy, setIsHealthy] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await chatApi.healthCheck();
        setIsHealthy(true);
      } catch (error) {
        console.error("API health check failed:", error);
        setIsHealthy(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkHealth();

    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isHealthy, isChecking };
};

export const useEquipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEquipment = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatApi.getAvailableEquipment();
      setEquipment(data.equipment || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  return { equipment, loading, error, refetch: fetchEquipment };
};

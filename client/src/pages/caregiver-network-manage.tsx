import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import PageTransition from "@/components/page-transition";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/bottom-navigation";
import { Heart, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function CaregiverManage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const createCaregiverMutation = useMutation({
    mutationFn: async (data: { name: string; relationship: string; contactInfo: string }) => {
      await apiRequest("POST", "/api/caregivers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/caregivers"] });
      setName("");
      setRelationship("");
      setContactInfo("");
      toast({
        title: "Success",
        description: "Caregiver successfully added",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        if (import.meta.env.PROD) {
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 500);
        }
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add caregiver",
        variant: "destructive",
      });
    },
  });

  const handleAddCaregiver = () => {
    if (!name.trim() || !relationship.trim() || !contactInfo.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createCaregiverMutation.mutate({
      name: name.trim(),
      relationship: relationship.trim(),
      contactInfo: contactInfo.trim(),
    });
  };

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    fetch('/api/mapbox-key')
      .then(res => res.json())
      .then(data => {
        if (data.key) {
          mapboxgl.accessToken = data.key;
          map.current = new mapboxgl.Map({
            container: mapContainer.current!,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [106.8456, -6.2088],
            zoom: 12
          });
        } else {
          toast({
            title: "Map Error",
            description: "Mapbox key not available",
            variant: "destructive",
          });
        }
      })
      .catch(err => {
        console.error('Failed to load map:', err);
        toast({
          title: "Map Error",
          description: "Failed to load map",
          variant: "destructive",
        });
      });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [toast]);

  return (
    <PageTransition>
      <div className="min-h-screen neuropad-bg pb-20">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 px-6 pt-6">
            <div className="flex items-center space-x-3">
              <Heart className="w-7 h-7 text-primary" />
              <h1 className="text-2xl font-serif font-bold neuropad-text-primary">Manage Caregivers</h1>
            </div>
            <Link to="/caregiver-network">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-11 h-11 rounded-2xl bg-white shadow-native flex items-center justify-center native-active"
                aria-label="Back to Caregiver Overview"
              >
                <ArrowLeft className="w-5 h-5 neuropad-text-primary" />
              </motion.button>
            </Link>
          </div>

          {/* Sub-page Navigation */}
          <div className="px-6 mb-4">
            <div className="flex gap-2">
              <Link to="/caregiver-network">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active"
                >
                  Overview
                </motion.button>
              </Link>
              <Link to="/caregiver-network/manage">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active"
                >
                  Manage
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Add Family Member Form */}
          <div className="neuropad-card p-6 mb-6 shadow-sm mx-6">
            <h2 className="text-xl font-bold mb-4 neuropad-text-primary">Add Family Member or Caregiver</h2>
            
            <Input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 mb-3 rounded-xl bg-gray-100 neuropad-text-secondary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="input-caregiver-name"
            />
            
            <Input
              type="text"
              placeholder="Relationship (e.g.: Mother, Husband, Child)"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-4 py-3 mb-3 rounded-xl bg-gray-100 neuropad-text-secondary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="input-caregiver-relationship"
            />
            
            <Input
              type="text"
              placeholder="Contact Info (e.g.: 08123456789)"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="w-full px-4 py-3 mb-4 rounded-xl bg-gray-100 neuropad-text-secondary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="input-caregiver-contact"
            />
            
            <motion.button
              onClick={handleAddCaregiver}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-full neuropad-primary neuropad-text-primary font-bold shadow-native"
              data-testid="button-add-caregiver"
            >
              {createCaregiverMutation.isPending ? "Adding..." : "Add Caregiver"}
            </motion.button>
          </div>

          {/* Location Sharing */}
          <div className="neuropad-card p-6 mb-6 shadow-sm mx-6">
            <h2 className="text-xl font-bold mb-4 neuropad-text-primary">Location Sharing</h2>
            <div className="w-full h-48 rounded-xl overflow-hidden relative bg-gray-100">
              <div ref={mapContainer} className="w-full h-full"></div>
              <div className="absolute top-2 left-2 bg-white bg-opacity-95 rounded-lg px-3 py-1.5 shadow-md z-10">
                <p className="text-xs font-semibold text-gray-800">Jakarta, Indonesia</p>
              </div>
            </div>
          </div>
        </div>

        <BottomNavigation currentPage="/caregiver-network" />
      </div>
    </PageTransition>
  );
}
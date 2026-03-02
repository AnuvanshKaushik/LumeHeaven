import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const ProfilePage = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [saving, setSaving] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/users/profile");
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          line1: data.address?.line1 || "",
          city: data.address?.city || "",
          state: data.address?.state || "",
          postalCode: data.address?.postalCode || "",
          country: data.address?.country || "",
        });
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load profile");
      }
    };

    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        address: {
          line1: form.line1,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
        },
      };

      const { data } = await api.put("/users/profile", payload);
      login({
        token: localStorage.getItem("lumeheaven_token") || localStorage.getItem("loomsheven_token"),
        user: data,
      });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page-wrap">
      <section className="section-wrap glass">
        <h1>Profile</h1>
        <form className="form-grid" onSubmit={submit}>
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
          <input placeholder="Address" value={form.line1} onChange={(e) => setForm((s) => ({ ...s, line1: e.target.value }))} />
          <input placeholder="City" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} />
          <input placeholder="State" value={form.state} onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))} />
          <input placeholder="Postal code" value={form.postalCode} onChange={(e) => setForm((s) => ({ ...s, postalCode: e.target.value }))} />
          <input placeholder="Country" value={form.country} onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))} />
          <button className="btn btn-primary" disabled={saving} type="submit">
            {saving ? "Saving..." : "Update Profile"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default ProfilePage;

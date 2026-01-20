"use client";
import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";
import QuillEditor from "@/app/dashboard/components/QuillEditor";
import {
  CustomButton,
  ErrorMessageCom,
} from "@/app/dashboard/components/miniComponents";
import { SettingsGetByTypePath } from "@/app/dashboard/storeAPICall/API/BaseApi";
import PrivacySkeleton from "./skeleton/PrivacySkeleton";
import { MdSave } from "react-icons/md";

type Props = {
  type: string;
  title?: string;
  subtitle?: string;
};

export default function PolicyEditor({ type, title, subtitle }: Props) {
  const [loading, setLoading] = useState(false);
  const [initialContent, setInitialContent] = useState("");
  const [loadingContent, setLoadingContent] = useState(true);
  const [adminPermissions, setAdminPermissions] = useState<any>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("adminPermissions");
      if (p) setAdminPermissions(JSON.parse(p));
    } catch (e) {
      // ignore
    }
  }, []);

  const lowerType = (type || "").toLowerCase();
  const canEditPolicy = lowerType.includes("privacy")
    ? adminPermissions?.["Privacy Policies"]?.edit ?? adminPermissions?.PrivacyPolicies?.edit ?? true
    : lowerType.includes("term") || lowerType.includes("condition")
      ? adminPermissions?.["Term & Condition"]?.edit ?? adminPermissions?.TermCondition?.edit ?? adminPermissions?.Term?.edit ?? true
      : true;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingContent(true);
      try {
        const res = await fetch(SettingsGetByTypePath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        });
        const json = await res.json();
        if (!mounted) return;
        setInitialContent(json?.data?.data || json?.data || "");
      } catch (e) {
        if (!mounted) return;
        setInitialContent("");
      } finally {
        if (mounted) setLoadingContent(false);
      }
      try {
        await import("quill/dist/quill.snow.css");
      } catch (e) { }
    })();
    return () => { mounted = false; };
  }, [type]);

  const validationSchema = Yup.object({
    content: Yup.string().required("Content is required"),
  });

  return (
    <Box mt={4}>
      <Formik
        enableReinitialize
        initialValues={{ content: initialContent }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            setLoading(true);
            const res = await fetch(SettingsGetByTypePath, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, data: values.content }),
            });
            const json = await res.json();
            Swal.fire({
              toast: true,
              position: "top-end",
              icon: "success",
              title: ToastMessages.POLICY_UPDATED,
              showConfirmButton: false,
              timer: 2000,
            });
          } catch (e) {
            Swal.fire({
              toast: true,
              position: "top-end",
              icon: "error",
              title: ToastMessages.POLICY_UPDATE_FAILED,
              text: (e as any)?.message || "An error occurred",
              showConfirmButton: false,
              timer: 2000,
            });
          } finally {
            setLoading(false);
            setSubmitting(false);
          }
        }}
      >
        {({
          values,
          touched,
          errors,
          handleSubmit,
          isSubmitting,
          setFieldValue,
        }) => (
          <Form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              {loadingContent ? (
                <PrivacySkeleton />
              ) : (
                <>
                  <QuillEditor
                    value={values.content || ""}
                    onChange={(val) => setFieldValue("content", val)}
                    minHeight={
                      type === "policy" || type === "termcondition"
                        ? "520px"
                        : "320px"
                    }
                  />
                  {touched.content && errors.content && (
                    <ErrorMessageCom error={errors.content as string} />
                  )}
                </>
              )}
            </div>

            {canEditPolicy && (
              <div className="ButtonOuter">
                {" "}
                <div className="buttoninner">
                  <CustomButton type="submit" disabled={isSubmitting || loading}>
                    {loading ? <CircularProgress size={24} color="inherit" />: (

                      <MdSave size={22} />
                    )
                    }


                    {`Update ${title}`}
                  </CustomButton>
                </div>
              </div>
            )}
          </Form>
        )}
      </Formik>
    </Box>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import QuillEditor from "@/app/dashboard/components/QuillEditor";
import {
  CustomButton,
  ErrorMessageCom,
} from "@/app/dashboard/components/miniComponents";
import { PolicySettingsPath } from "@/app/dashboard/storeAPICall/API/BaseApi";
import { PolicySettingsStore } from "@/app/dashboard/storeAPICall/useUserStore";
import Toast from "@/utils/Toast";
import PrivacySkeleton from "./skeleton/PrivacySkeleton";

type Props = {
  type: string;
  title?: string;
  subtitle?: string;
};

export default function PolicyEditor({ type, title, subtitle }: Props) {
  const { postData, loading, clearData } = PolicySettingsStore();
  const [initialContent, setInitialContent] = useState("");
  const [loadingContent, setLoadingContent] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingContent(true);
      try {
        const res = await fetch(`${PolicySettingsPath}?type=${type}`);
        const json = await res.json();
        if (!mounted) return;
        setInitialContent(json?.data || "");
      } catch (e) {
        if (!mounted) return;
        setInitialContent("");
      } finally {
        if (mounted) setLoadingContent(false);
      }
      try {
        await import("quill/dist/quill.snow.css");
      } catch (e) {}
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
            const res = await postData?.(PolicySettingsPath, {
              type,
              content: values.content,
            });
            setToastMsg(res?.message || "Saved");
            try {
              clearData && clearData();
            } catch (e) {}
          } catch (e) {
            const errMsg = (e as any)?.message || "Save failed";
            setToastMsg(errMsg);
          } finally {
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
                <PrivacySkeleton  />
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

            <div className="mt-8 flex ButtonOuter w-full">
              {" "}
              <div className="buttoninner  w-full max-w-sm">
                <CustomButton type="submit" disabled={isSubmitting || loading}>
                  {loading ? "Saving..." : "Save"}
                </CustomButton>
              </div>
            </div>
            {toastMsg && <Toast message={toastMsg} />}
          </Form>
        )}
      </Formik>
    </Box>
  );
}

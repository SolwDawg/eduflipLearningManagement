import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CustomFormField } from "@/components/CustomFormField";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "@/state/api";
import { toast } from "sonner";

// Category form schema
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  slug: z.string().min(1, "Slug is required"),
  isActive: z.boolean().default(true),
  order: z.number().default(0),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  onSuccess?: () => void;
  category?: Category;
  mode?: "create" | "edit";
}

const CategoryForm = ({
  onSuccess,
  category,
  mode = "create",
}: CategoryFormProps) => {
  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();

  const isLoading = isCreating || isUpdating;
  const isEditMode = mode === "edit";

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      isActive: true,
      order: 0,
    },
  });

  // Set form values when in edit mode and category data is available
  useEffect(() => {
    if (isEditMode && category) {
      form.reset({
        name: category.name,
        description: category.description,
        slug: category.slug,
        isActive: category.isActive,
        order: category.order,
      });
    }
  }, [category, form, isEditMode]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isEditMode && category) {
        // For edit mode, we need the original slug to identify the category
        // and the updated data, but exclude the slug since it's the identifier
        const { slug, ...updateData } = data;
        await updateCategory({
          slug: category.slug,
          categoryData: updateData,
        }).unwrap();
        toast.success("Category updated successfully");
      } else {
        // Create mode
        await createCategory(data).unwrap();
        form.reset();
        toast.success("Category created successfully");
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(
        isEditMode ? "Failed to update category" : "Failed to create category"
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <CustomFormField
          name="name"
          label="Category Name"
          type="text"
          placeholder="Enter category name"
        />

        <CustomFormField
          name="description"
          label="Description"
          type="textarea"
          placeholder="Enter category description"
        />

        <CustomFormField
          name="slug"
          label="Slug"
          type="text"
          placeholder="Enter unique slug (e.g. web-development)"
          disabled={isEditMode} // Disable slug field in edit mode
        />

        <CustomFormField name="isActive" label="Active" type="switch" />

        <CustomFormField
          name="order"
          label="Display Order"
          type="number"
          placeholder="0"
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading
            ? isEditMode
              ? "Updating..."
              : "Creating..."
            : isEditMode
            ? "Update Category"
            : "Create Category"}
        </Button>
      </form>
    </Form>
  );
};

export default CategoryForm;

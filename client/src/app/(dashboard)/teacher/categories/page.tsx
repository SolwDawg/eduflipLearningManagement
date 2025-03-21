"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/state/api";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Form schema for category
const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug must contain only lowercase letters, numbers, and hyphens",
    }),
  isActive: z.boolean().default(true),
  order: z.number().int().nonnegative().default(0),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function CategoriesPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<any>(null);

  const { data: categories, isLoading } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreatingCategory }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdatingCategory }] =
    useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeletingCategory }] =
    useDeleteCategoryMutation();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      isActive: true,
      order: 0,
    },
  });

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      if (isEditing && currentCategory) {
        const { slug, ...dataWithoutSlug } = data;
        await updateCategory({
          slug: currentCategory.slug,
          ...dataWithoutSlug,
        }).unwrap();
        toast.success("Category updated successfully");
      } else {
        // Check if a category with this slug already exists in the data
        const slugExists = categories?.data?.some(
          (category: any) => category.slug === data.slug
        );

        if (slugExists) {
          toast.error("A category with this slug already exists");
          return;
        }

        await createCategory(data).unwrap();
        toast.success("Category created successfully");
      }
      form.reset();
      setIsCreating(false);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    }
  };

  const handleEdit = (category: any) => {
    setCurrentCategory(category);
    form.reset({
      name: category.name,
      description: category.description,
      slug: category.slug,
      isActive: category.isActive,
      order: category.order,
    });
    setIsEditing(true);
  };

  const handleDelete = async (slug: string) => {
    try {
      await deleteCategory(slug).unwrap();
      toast.success("Category deleted successfully");
      setIsDeleting(false);
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const openCreateDialog = () => {
    form.reset({
      name: "",
      description: "",
      slug: "",
      isActive: true,
      order: 0,
    });
    setIsCreating(true);
  };

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  // Watch name field to auto-generate slug
  const watchName = form.watch("name");
  useEffect(() => {
    if (watchName && !isEditing && !form.getValues("slug")) {
      const slug = generateSlug(watchName);
      form.setValue("slug", slug);
    }
  }, [watchName, isEditing, form]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Header
        title="Categories"
        subtitle="Manage course categories"
        rightElement={
          <Button onClick={openCreateDialog}>
            <Plus size={16} className="mr-2" />
            Add Category
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center my-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.data && categories.data.length > 0 ? (
                categories.data.map((category: any) => (
                  <TableRow key={category.slug}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {category.description}
                    </TableCell>
                    <TableCell>{category.slug}</TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          category.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Dialog
                          open={
                            isDeleting &&
                            currentCategory?.slug === category.slug
                          }
                          onOpenChange={(open) => {
                            if (!open) setIsDeleting(false);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-500"
                              onClick={() => {
                                setCurrentCategory(category);
                                setIsDeleting(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Delete</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this category?
                                This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsDeleting(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  handleDelete(currentCategory.slug)
                                }
                                disabled={isDeletingCategory}
                              >
                                {isDeletingCategory && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Delete
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-gray-500"
                  >
                    No categories found. Create your first category to get
                    started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog for creating/editing categories */}
      <Dialog
        open={isCreating || isEditing}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setIsEditing(false);
            form.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Category" : "Create New Category"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the details of this category"
                : "Add a new category for organizing courses"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-2"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g. Programming" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the category"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. programming"
                        {...field}
                        disabled={isEditing}
                      />
                    </FormControl>
                    <FormDescription>
                      Used in URLs. Auto-generated from name, but you can
                      customize it.
                      {isEditing && " Cannot be changed once created."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Inactive categories won't be shown to students
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Lower numbers will be displayed first
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingCategory || isUpdatingCategory}
                >
                  {(isCreatingCategory || isUpdatingCategory) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

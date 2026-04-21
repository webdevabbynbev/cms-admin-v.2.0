import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader, LoadingState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  ProductFormBasic,
  ProductFormCategory,
  ProductFormSeo,
  ProductFormVariants,
  ProductFormMedia,
  FloatingSaveBar,
} from '../components/form';
import { useCreateProduct, useProduct, useUpdateProduct } from '../hooks';
import { productFormSchema, defaultProductFormValues, type ProductFormValues } from '../schemas';
import {
  applyDuplicateTransform,
  buildProductPayload,
  productDetailToFormValues,
} from '../utils/form-payload';

const ProductFormPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const rawId = searchParams.get('id');
  const productId = rawId ? Number(rawId) : null;

  // Duplicate mode: URL path contains /product-duplicate OR ?mode=duplicate
  const isDuplicate =
    location.pathname.includes('product-duplicate') ||
    searchParams.get('mode') === 'duplicate';

  const hasId = productId !== null && Number.isFinite(productId);
  const isEdit = hasId && !isDuplicate;

  // Fetch detail for both edit + duplicate modes
  const { data: detail, isLoading: isLoadingDetail } = useProduct(hasId ? productId : null);
  const { mutateAsync: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutateAsync: updateProduct, isPending: isUpdating } = useUpdateProduct();

  const isPending = isCreating || isUpdating;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultProductFormValues,
  });

  useEffect(() => {
    if (detail) {
      const values = productDetailToFormValues(detail);
      form.reset(isDuplicate ? applyDuplicateTransform(values) : values);
    }
  }, [detail, isDuplicate, form]);

  const onSubmit = async (values: ProductFormValues) => {
    try {
      const payload = buildProductPayload(values, isDuplicate ? null : detail ?? null);
      if (isEdit && productId) {
        await updateProduct({ id: productId, payload });
        toast.success('Product updated');
      } else {
        await createProduct(payload);
        toast.success(isDuplicate ? 'Product duplicated' : 'Product created');
      }
      navigate('/products-new');
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Failed to save product');
      toast.error(msg);
    }
  };

  const pageTitle = useMemo(() => {
    if (isDuplicate) return `Duplicate Product${detail?.name ? `: ${detail.name}` : ''}`;
    if (isEdit) return `Edit Product${detail?.name ? `: ${detail.name}` : ''}`;
    return 'Add New Product';
  }, [isDuplicate, isEdit, detail?.name]);

  if (hasId && isLoadingDetail) {
    return (
      <AppShell>
        <PageContainer>
          <LoadingState message="Loading product details..." />
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageContainer>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <PageHeader
                title={pageTitle}
                description={
                  isDuplicate
                    ? 'Review the copied data and save to create a new product.'
                    : isEdit
                      ? 'Update product information. Save changes when done.'
                      : 'Create a new product in your catalog.'
                }
                actions={
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/products-new')}
                      disabled={isPending}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isEdit ? 'Save Changes' : isDuplicate ? 'Save as New' : 'Create Product'}
                    </Button>
                  </>
                }
              />

              <Tabs defaultValue="basic" className="w-full">
                <TabsList>
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="category">Category</TabsTrigger>
                  <TabsTrigger value="variants">Variants</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="mt-4">
                  <ProductFormBasic />
                </TabsContent>
                <TabsContent value="category" className="mt-4">
                  <ProductFormCategory />
                </TabsContent>
                <TabsContent value="variants" className="mt-4">
                  <ProductFormVariants />
                </TabsContent>
                <TabsContent value="media" className="mt-4">
                  <ProductFormMedia />
                </TabsContent>
                <TabsContent value="seo" className="mt-4">
                  <ProductFormSeo />
                </TabsContent>
              </Tabs>

              <FloatingSaveBar
                isPending={isPending}
                canUndo={isEdit}
                saveLabel={isEdit ? 'Simpan perubahan' : isDuplicate ? 'Save as New' : 'Create'}
              />
            </form>
          </FormProvider>
      </PageContainer>
    </AppShell>
  );
};

export default ProductFormPage;

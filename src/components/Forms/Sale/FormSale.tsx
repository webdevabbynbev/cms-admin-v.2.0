import React from "react";
import { Button, Form } from "antd";
import type { FormInstance } from "antd";
import { useFormSale } from "../../../hooks/useFormSale";
import SaleHeader from "./SaleHeader";
import SaleInfoCard from "./SaleInfoCard";
import SaleScheduleCard from "./SaleScheduleCard";
import ProductsVariantsCard from "./ProductsVariantsCard";
import type { SaleRecord } from "./saleTypes";

type Props = {
  data?: SaleRecord | null;
  handleClose: () => void;
  form?: FormInstance;
  saleId?: number;
  showSubmitButton?: boolean;
  onLoadingChange?: (loading: boolean) => void;
};


const FormSale: React.FC<Props> = ({
  data,
  handleClose,
  form: propForm,
  saleId,
  showSubmitButton = true,
  onLoadingChange,
}) => {
  const [formInstance] = Form.useForm();
  const form = propForm || formInstance;

  const {
    loading,
    productOptions,
    productLoading,
    selectedProductId,
    setSelectedProductId,
    selectedProductName,
    setSelectedProductName,
    variants,
    inputMode,
    setInputMode,
    brandOptions,
    brandProductOptions,
    brandLoading,
    selectedBrandId,
    selectedBrandName,
    selectedProductIds,
    selectedProductNameMap,
    variantOptions,
    variantLoading,
    selectedVariantIdsToAdd,
    setSelectedBrandId,
    setSelectedBrandName,
    setSelectedProductIds,
    setSelectedProductNameMap,
    setSelectedVariantIdsToAdd,
    productGroups,
    summary,
    searchProducts,
    searchBrands,
    loadMoreBrands,
    searchBrandProducts,
    searchVariantsGlobal,
    addProductToVariants,
    addProductsToVariants,
    addVariantIdsToSale,
    removeProduct,
    removeVariant,
    updateVariant,
    onFinish,
  } = useFormSale({
    data,
    form,
    saleId,
    onLoadingChange,
    handleClose,
  });

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={loading}
    >
      <SaleHeader />
      <SaleInfoCard />
      <SaleScheduleCard />
      <ProductsVariantsCard
        inputMode={inputMode}
        setInputMode={setInputMode}
        productOptions={productOptions}
        productLoading={productLoading}
        selectedProductId={selectedProductId}
        setSelectedProductId={setSelectedProductId}
        selectedProductName={selectedProductName}
        setSelectedProductName={setSelectedProductName}
        brandOptions={brandOptions}
        brandProductOptions={brandProductOptions}
        brandLoading={brandLoading}
        selectedBrandId={selectedBrandId}
        setSelectedBrandId={setSelectedBrandId}
        selectedBrandName={selectedBrandName}
        setSelectedBrandName={setSelectedBrandName}
        selectedProductIds={selectedProductIds}
        setSelectedProductIds={setSelectedProductIds}
        selectedProductNameMap={selectedProductNameMap}
        setSelectedProductNameMap={setSelectedProductNameMap}
        variantOptions={variantOptions}
        variantLoading={variantLoading}
        selectedVariantIdsToAdd={selectedVariantIdsToAdd}
        setSelectedVariantIdsToAdd={setSelectedVariantIdsToAdd}
        variants={variants}
        productGroups={productGroups}
        summary={summary}
        searchProducts={searchProducts}
        searchBrands={searchBrands}
        loadMoreBrands={loadMoreBrands}
        searchBrandProducts={searchBrandProducts}
        searchVariantsGlobal={searchVariantsGlobal}
        addProductToVariants={addProductToVariants}
        addProductsToVariants={addProductsToVariants}
        addVariantIdsToSale={addVariantIdsToSale}
        removeProduct={removeProduct}
        removeVariant={removeVariant}
        updateVariant={updateVariant}
      />

      {showSubmitButton && (
        <Form.Item style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" block size="large">
            Simpan Sale
          </Button>
        </Form.Item>
      )}
    </Form>
  );
};

export default FormSale;

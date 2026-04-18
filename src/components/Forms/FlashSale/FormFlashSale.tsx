import React from "react";
import { Button, Form } from "antd";
import type { FormInstance } from "antd";
import { useFormFlashSale } from "../../../hooks/flashsale/useFormFlashSale";
import FlashSaleHeader from "./FlashSaleHeader";
import FlashSaleInfoCard from "./FlashSaleInfoCard";
import FlashSaleScheduleCard from "./FlashSaleScheduleCard";
import FlashProductsVariantsCard from "./FlashProductsVariantsCard";
import type { FlashSaleRecord } from "./flashTypes";

type Props = {
  data?: FlashSaleRecord | null;
  handleClose: () => void;
  form?: FormInstance;
  flashSaleId?: number;
  showSubmitButton?: boolean;
  onLoadingChange?: (loading: boolean) => void;
};


const FormFlashSale: React.FC<Props> = ({
  data,
  handleClose,
  form: propForm,
  flashSaleId,
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
    selectedVariantIds,
    setSelectedVariantIds,
    bulkPercent,
    setBulkPercent,
    bulkPrice,
    setBulkPrice,
    bulkStock,
    setBulkStock,
    applyBulk,
    deleteSelectedVariants,
    inputMode,
    setInputMode,
    brandOptions,
    brandLoading,
    selectedBrandIds,
    selectedBrandNameMap,
    variantOptions,
    variantLoading,
    selectedVariantIdsToAdd,
    setSelectedBrandIds,
    setSelectedBrandNameMap,
    setSelectedVariantIdsToAdd,
    productGroups,
    summary,
    searchProducts,
    searchBrands,
    loadMoreBrands,
    searchVariantsGlobal,
    addProductToVariants,
    addBrandsToVariants,
    removeBrandsFromVariants,
    addVariantIdsToFlashSale,
    removeProduct,
    removeVariant,
    updateVariant,
    onFinish,
  } = useFormFlashSale({
    data,
    form,
    flashSaleId,
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
      <FlashSaleHeader />
      <FlashSaleInfoCard />
      <FlashSaleScheduleCard />
      <FlashProductsVariantsCard
        inputMode={inputMode}
        setInputMode={setInputMode}
        productOptions={productOptions}
        productLoading={productLoading}
        selectedProductId={selectedProductId}
        setSelectedProductId={setSelectedProductId}
        selectedProductName={selectedProductName}
        setSelectedProductName={setSelectedProductName}
        brandOptions={brandOptions}
        brandLoading={brandLoading}
        selectedBrandIds={selectedBrandIds}
        setSelectedBrandIds={setSelectedBrandIds}
        selectedBrandNameMap={selectedBrandNameMap}
        setSelectedBrandNameMap={setSelectedBrandNameMap}
        variantOptions={variantOptions}
        variantLoading={variantLoading}
        selectedVariantIdsToAdd={selectedVariantIdsToAdd}
        setSelectedVariantIdsToAdd={setSelectedVariantIdsToAdd}
        selectedVariantIds={selectedVariantIds}
        setSelectedVariantIds={setSelectedVariantIds}
        bulkPercent={bulkPercent}
        setBulkPercent={setBulkPercent}
        bulkPrice={bulkPrice}
        setBulkPrice={setBulkPrice}
        bulkStock={bulkStock}
        setBulkStock={setBulkStock}
        applyBulk={applyBulk}
        deleteSelectedVariants={deleteSelectedVariants}
        variants={variants}
        productGroups={productGroups}
        summary={summary}
        searchProducts={searchProducts}
        searchBrands={searchBrands}
        loadMoreBrands={loadMoreBrands}
        searchVariantsGlobal={searchVariantsGlobal}
        addProductToVariants={addProductToVariants}
        addBrandsToVariants={addBrandsToVariants}
        removeBrandsFromVariants={removeBrandsFromVariants}
        addVariantIdsToFlashSale={addVariantIdsToFlashSale}
        removeProduct={removeProduct}
        removeVariant={removeVariant}
        updateVariant={updateVariant}
      />

      {showSubmitButton && (
        <Form.Item style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" block size="large">
            Simpan Flash Sale
          </Button>
        </Form.Item>
      )}
    </Form>
  );
};

export default FormFlashSale;

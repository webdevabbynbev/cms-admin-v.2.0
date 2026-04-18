import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { message, Modal } from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import http from "../../../api/http";
import { env } from "../../../utils/env";
import { toWib, wibNow } from "../../../utils/timezone";

dayjs.extend(isBetween);

type RangeFilter = {
  start: string;
  end: string;
  label: string;
} | null;

type BannerFormState = {
  id: number | null;
  title: string;
  date: string;
  imageFile: File | null;
  imageUrl: string | null;
  imageType: "upload" | "link";
  imageLink: string;
  imageMobileFile: File | null;
  imageMobileUrl: string | null;
  imageMobileType: "upload" | "link";
  imageMobileLink: string;
};

type ProductOption = {
  label: string;
  value: number;
  image?: string;
  masterSku?: string | null;
  brandName?: string | null;
  segment?: "abby" | "bev" | "unknown" | "general";
};

const MAX_RECOMMENDATIONS_PER_DAY = 4;

const defaultBannerForm: BannerFormState = {
  id: null,
  title: "",
  date: "",
  imageFile: null,
  imageUrl: null,
  imageType: "upload",
  imageLink: "",
  imageMobileFile: null,
  imageMobileUrl: null,
  imageMobileType: "upload",
  imageMobileLink: "",
};

const useRecommendation = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedProductAbby, setSelectedProductAbby] = useState<number[]>([]);
  const [selectedProductBev, setSelectedProductBev] = useState<number[]>([]);
  const [selectedProductGeneral, setSelectedProductGeneral] = useState<
    number[]
  >([]);
  const [editingRecommendation, setEditingRecommendation] = useState<{
    id: number;
    date: string;
    productId: number;
  } | null>(null);
  const [addDiscount, setAddDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<"percent" | "nominal">(
    "percent",
  );
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [discountMaxPrice, setDiscountMaxPrice] = useState<number | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number | null>(null);

  const [productList, setProductList] = useState<ProductOption[]>([]);
  const [searchProductList, setSearchProductList] = useState<ProductOption[]>(
    [],
  );
  const [productLoading, setProductLoading] = useState(false);
  const [pickLoading, setPickLoading] = useState(false);
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>(null);

  const [banners, setBanners] = useState<any[]>([]);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [bannerForm, setBannerForm] =
    useState<BannerFormState>(defaultBannerForm);
  const [bannerFileList, setBannerFileList] = useState<any[]>([]);
  const [bannerMobileFileList, setBannerMobileFileList] = useState<any[]>([]);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toDateKey = useCallback((dateStr?: string | null) => {
    if (!dateStr) return "";
    const parsed = toWib(String(dateStr));
    if (!parsed || !parsed.isValid()) return "";
    return parsed.format("YYYY-MM-DD");
  }, []);

  const recommendationCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    (data || []).forEach((item: any) => {
      const dateKey = toDateKey(
        item?.recommendationDate || item?.recommendation_date,
      );
      if (!dateKey) return;
      map.set(dateKey, (map.get(dateKey) || 0) + 1);
    });
    return map;
  }, [data, toDateKey]);

  const recommendationDates = useMemo(
    () => Array.from(recommendationCountByDate.keys()).sort(),
    [recommendationCountByDate],
  );

  const selectedDateKey = useMemo(
    () => toDateKey(selectedDate),
    [selectedDate, toDateKey],
  );

  const selectedDateCount = useMemo(() => {
    if (!selectedDateKey) return 0;
    return recommendationCountByDate.get(selectedDateKey) || 0;
  }, [recommendationCountByDate, selectedDateKey]);

  const editingDateKey = useMemo(
    () => toDateKey(editingRecommendation?.date || ""),
    [editingRecommendation, toDateKey],
  );

  const isEditingSameDate = useMemo(() => {
    if (!editingRecommendation?.id) return false;
    if (!selectedDateKey || !editingDateKey) return false;
    return selectedDateKey === editingDateKey;
  }, [editingRecommendation, selectedDateKey, editingDateKey]);

  const maxSelectable = useMemo(() => {
    if (!selectedDateKey) return MAX_RECOMMENDATIONS_PER_DAY;
    const base =
      MAX_RECOMMENDATIONS_PER_DAY -
      selectedDateCount +
      (isEditingSameDate ? 1 : 0);
    return Math.max(0, base);
  }, [selectedDateCount, selectedDateKey, isEditingSameDate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const perPage = 200;
      let page = 1;
      let rows: any[] = [];

      for (;;) {
        const res: any = await http.get(
          `/admin/ramadan-recommendations?page=${page}&per_page=${perPage}`,
        );
        const serve = res?.data?.serve ?? res?.data ?? {};
        const list = Array.isArray(serve.data) ? serve.data : [];
        rows = rows.concat(list);

        const total = Number(serve.total ?? rows.length);
        const currentPage = Number(serve.currentPage ?? page);
        const lastPage = Number(serve.lastPage ?? 0);

        if (!list.length) break;
        if (lastPage && currentPage >= lastPage) break;
        if (rows.length >= total) break;

        page = currentPage + 1;
      }

      setData(rows);
    } catch (error) {
      
      message.error("Gagal memuat data rekomendasi");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBanners = useCallback(async () => {
    setBannerLoading(true);
    try {
      const res: any = await http.get("/admin/ramadan-recommendation-banners");
      const serve = res?.data?.serve ?? res?.data ?? {};
      setBanners(serve.data || []);
    } catch (error) {
      
    } finally {
      setBannerLoading(false);
    }
  }, []);

  const inferSegment = useCallback(
    (rawSku?: string | null, brandName?: string | null) => {
      const sku = String(rawSku ?? "").trim().toLowerCase();
      const brand = String(brandName ?? "").trim().toLowerCase();
      if (sku.startsWith("ab-") || sku.startsWith("abby")) return "abby";
      if (
        sku.startsWith("bv-") ||
        sku.startsWith("bev") ||
        sku.startsWith("bb-")
      )
        return "bev";
      if (brand.includes("abby")) return "abby";
      if (brand.includes("bev")) return "bev";
      return "unknown";
    },
    [],
  );

  const toProductOption = useCallback(
    (product: any, segment: "abby" | "bev" | "general") => {
      const productId =
        product?.id ?? product?.productId ?? product?.product_id ?? null;
      const productName = product?.name ?? product?.product_name ?? null;
      if (!productId || !productName) return null;

      const productImage =
        product?.medias?.[0]?.url ??
        product?.media?.[0]?.url ??
        product?.image ??
        product?.image_url ??
        undefined;
      const productMasterSku = product?.masterSku ?? product?.master_sku ?? null;
      const productBrandName =
        product?.brand?.name ?? product?.brand_name ?? null;

      return {
        label: productName,
        value: Number(productId),
        image: productImage,
        masterSku: productMasterSku,
        brandName: productBrandName,
        segment,
      } as ProductOption;
    },
    [],
  );

  const fetchPickProducts = useCallback(async () => {
    setPickLoading(true);
    try {
      const [abbyRes, bevRes] = await Promise.all([
        http.get("/admin/abby-picks?page=1&limit=200"),
        http.get("/admin/bev-picks?page=1&limit=200"),
      ]);

      const abbyServe = abbyRes?.data?.serve ?? abbyRes?.data ?? {};
      const bevServe = bevRes?.data?.serve ?? bevRes?.data ?? {};
      const abbyRows = Array.isArray(abbyServe?.data) ? abbyServe.data : [];
      const bevRows = Array.isArray(bevServe?.data) ? bevServe.data : [];

      const abbyOptions: ProductOption[] = [];
      const seenAbby = new Set<number>();
      abbyRows.forEach((row: any) => {
        const option = toProductOption(row?.product ?? row, "abby");
        if (!option) return;
        if (seenAbby.has(option.value)) return;
        seenAbby.add(option.value);
        abbyOptions.push(option);
      });

      const bevOptions: ProductOption[] = [];
      const seenBev = new Set<number>();
      bevRows.forEach((row: any) => {
        const option = toProductOption(row?.product ?? row, "bev");
        if (!option) return;
        if (seenBev.has(option.value)) return;
        seenBev.add(option.value);
        bevOptions.push(option);
      });

      setProductList([...abbyOptions, ...bevOptions]);
    } catch (error) {
      
      message.error("Gagal memuat daftar produk picks");
    } finally {
      setPickLoading(false);
    }
  }, [toProductOption]);

  const fetchProducts = useCallback(
    async (search = "") => {
      setProductLoading(true);
      try {
        let url = "/admin/products?page=1&per_page=20";
        if (search) url += `&q=${encodeURIComponent(search)}`;

        const res: any = await http.get(url);
        const serve = res.data?.serve ?? res.data;
        const rows = serve?.data || [];

        const productMap = new Map<number, ProductOption>();
        (Array.isArray(rows) ? rows : []).forEach((row: any) => {
          const option = toProductOption(row, "general");
          if (!option) return;
          if (!productMap.has(option.value)) {
            productMap.set(option.value, option);
          }
        });

        setSearchProductList(Array.from(productMap.values()));
      } catch (error) {
        
        message.error("Gagal memuat daftar produk");
      } finally {
        setProductLoading(false);
      }
    },
    [toProductOption],
  );

  useEffect(() => {
    fetchData();
    fetchPickProducts();
    fetchProducts();
    fetchBanners();
  }, [fetchBanners, fetchData, fetchPickProducts, fetchProducts]);

  const handleSearchProduct = useCallback(
    (val: string) => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
      searchTimer.current = setTimeout(() => {
        fetchProducts(val);
      }, 600);
    },
    [fetchProducts],
  );

  useEffect(() => {
    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, []);

  const resetDiscountForm = useCallback(() => {
    setAddDiscount(false);
    setDiscountType("percent");
    setDiscountPercent(null);
    setDiscountMaxPrice(null);
    setDiscountAmount(null);
  }, []);

  const resetRecommendationForm = useCallback(() => {
    setSelectedProductAbby([]);
    setSelectedProductBev([]);
    setSelectedProductGeneral([]);
    setSelectedDate("");
    setEditingRecommendation(null);
    resetDiscountForm();
  }, [resetDiscountForm]);

  const selectedProductAll = useMemo(() => {
    const merged = [
      ...selectedProductAbby,
      ...selectedProductBev,
      ...selectedProductGeneral,
    ];
    return Array.from(new Set(merged.map((v) => Number(v)).filter(Boolean)));
  }, [selectedProductAbby, selectedProductBev, selectedProductGeneral]);

  const handleSubmit = useCallback(async () => {
    if (!selectedDate || !selectedProductAll.length) {
      message.warning("Mohon pilih tanggal dan produk terlebih dahulu");
      return;
    }
    if (selectedProductAll.length > maxSelectable) {
      message.warning(
        `Maksimal ${MAX_RECOMMENDATIONS_PER_DAY} produk per tanggal. Sisa slot: ${maxSelectable}.`,
      );
      return;
    }
    if (addDiscount) {
      if (discountType === "percent") {
        if (!discountPercent || discountPercent <= 0) {
          message.warning("Mohon isi persen diskon");
          return;
        }
        if (discountPercent > 100) {
          message.warning("Persen diskon maksimal 100%");
          return;
        }
        if (!discountMaxPrice || discountMaxPrice <= 0) {
          message.warning("Mohon isi maksimal harga diskon");
          return;
        }
      } else if (!discountAmount || discountAmount <= 0) {
        message.warning("Mohon isi nominal potongan harga");
        return;
      }
    }
    try {
      if (editingRecommendation?.id) {
        await http.delete(
          `/admin/ramadan-recommendations/${editingRecommendation.id}`,
        );
      }
      await Promise.all(
        selectedProductAll.map((productId) =>
          http.post("/admin/ramadan-recommendations", {
            product_id: productId,
            recommendation_date: selectedDate,
            discount_enabled: addDiscount ? 1 : 0,
            discount_type: addDiscount ? discountType : null,
            discount_percent:
              addDiscount && discountType === "percent"
                ? discountPercent
                : null,
            discount_max_price:
              addDiscount && discountType === "percent"
                ? discountMaxPrice
                : null,
            discount_amount:
              addDiscount && discountType === "nominal" ? discountAmount : null,
          }),
        ),
      );
      message.success("Rekomendasi berhasil disimpan");
      setIsModalOpen(false);
      resetRecommendationForm();
      fetchData();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Gagal menambahkan rekomendasi",
      );
    }
  }, [
    addDiscount,
    discountAmount,
    discountMaxPrice,
    discountPercent,
    discountType,
    editingRecommendation,
    fetchData,
    maxSelectable,
    resetRecommendationForm,
    selectedDate,
    selectedProductAll,
  ]);

  const handleDelete = useCallback(
    (id: number) => {
      Modal.confirm({
        title: "Hapus Rekomendasi",
        content: "Apakah Anda yakin ingin menghapus rekomendasi ini?",
        okText: "Hapus",
        cancelText: "Batal",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await http.delete(`/admin/ramadan-recommendations/${id}`);
            message.success("Rekomendasi berhasil dihapus");
            fetchData();
          } catch (error) {
            message.error("Gagal menghapus rekomendasi");
          }
        },
      });
    },
    [fetchData],
  );

  const resetBannerForm = useCallback(() => {
    setBannerForm(defaultBannerForm);
    setBannerFileList([]);
    setBannerMobileFileList([]);
  }, []);

  const handleBannerSubmit = useCallback(async () => {
    if (
      !bannerForm.title ||
      !bannerForm.date ||
      (bannerForm.imageType === "upload" &&
        !bannerForm.imageFile &&
        !bannerForm.imageUrl) ||
      (bannerForm.imageType === "link" && !bannerForm.imageLink) ||
      (bannerForm.imageMobileType === "upload" &&
        !bannerForm.imageMobileFile &&
        !bannerForm.imageMobileUrl) ||
      (bannerForm.imageMobileType === "link" &&
        !bannerForm.imageMobileLink)
    ) {
      message.warning("Mohon lengkapi judul, tanggal, dan gambar banner");
      return;
    }

    const dateKey = toDateKey(bannerForm.date);
    if (!dateKey) {
      message.warning("Tanggal banner tidak valid");
      return;
    }

    if (!recommendationCountByDate.has(dateKey)) {
      message.warning(
        "Tanggal banner harus sesuai dengan tanggal rekomendasi yang tersedia",
      );
      return;
    }

    const existingBanner = (banners || []).find((b: any) => {
      const d = toDateKey(b?.bannerDate || b?.banner_date || "");
      return d && d === dateKey;
    });
    if (existingBanner && Number(existingBanner.id) !== Number(bannerForm.id)) {
      message.warning("Banner untuk tanggal ini sudah ada");
      return;
    }

    const uploadImage = async (file: File, folder: string) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const res = await http.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res?.data?.serve || null;
    };

    try {
      let imageUrl = bannerForm.imageUrl;
      if (bannerForm.imageType === "upload" && bannerForm.imageFile) {
        imageUrl = await uploadImage(bannerForm.imageFile, "Banners/Ramadhan/Desktop");
      } else if (bannerForm.imageType === "link") {
        imageUrl = bannerForm.imageLink;
      }

      let imageMobileUrl = bannerForm.imageMobileUrl;
      if (bannerForm.imageMobileType === "upload" && bannerForm.imageMobileFile) {
        imageMobileUrl = await uploadImage(bannerForm.imageMobileFile, "Banners/Ramadhan/Mobile");
      } else if (bannerForm.imageMobileType === "link") {
        imageMobileUrl = bannerForm.imageMobileLink;
      }

      const payload: any = {
        title: bannerForm.title,
        banner_date: bannerForm.date,
        image_type: bannerForm.imageType,
        image_url: imageUrl,
      };

      if (imageMobileUrl) {
        payload.image_mobile_type = bannerForm.imageMobileType;
        payload.image_mobile_url = imageMobileUrl;
      }

      if (bannerForm.id) {
        await http.put(
          `/admin/ramadan-recommendation-banners/${bannerForm.id}`,
          payload,
        );
        message.success("Banner berhasil diperbarui");
      } else {
        await http.post("/admin/ramadan-recommendation-banners", payload);
        message.success("Banner berhasil ditambahkan");
      }
      setBannerModalOpen(false);
      resetBannerForm();
      fetchBanners();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Gagal menyimpan banner");
    }
  }, [
    bannerForm,
    banners,
    fetchBanners,
    recommendationCountByDate,
    resetBannerForm,
    toDateKey,
  ]);

  const handleBannerDelete = useCallback(
    (id: number) => {
      Modal.confirm({
        title: "Hapus Banner",
        content: "Apakah Anda yakin ingin menghapus banner ini?",
        okText: "Hapus",
        cancelText: "Batal",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await http.delete(`/admin/ramadan-recommendation-banners/${id}`);
            message.success("Banner berhasil dihapus");
            fetchBanners();
          } catch (error) {
            message.error("Gagal menghapus banner");
          }
        },
      });
    },
    [fetchBanners],
  );

  const openEditBanner = useCallback((record: any) => {
    const recordImageUrl = record.imageUrl || record.image_url || null;
    const recordMobileUrl =
      record.imageMobileUrl || record.image_mobile_url || null;
    setBannerForm({
      id: Number(record.id),
      title: record.title || "",
      date: record.bannerDate || record.banner_date || "",
      imageFile: null,
      imageUrl: recordImageUrl,
      imageType: recordImageUrl ? "link" : "upload",
      imageLink: recordImageUrl ? String(recordImageUrl) : "",
      imageMobileFile: null,
      imageMobileUrl: recordMobileUrl,
      imageMobileType: recordMobileUrl ? "link" : "upload",
      imageMobileLink: recordMobileUrl ? String(recordMobileUrl) : "",
    });
    setBannerFileList([]);
    setBannerMobileFileList([]);
    setBannerModalOpen(true);
  }, []);

  const openEditRecommendation = useCallback((item: any, dateOverride?: string) => {
    const productId =
      item?.productId || item?.product_id || item?.product?.id || null;
    const date =
      dateOverride || item?.recommendationDate || item?.recommendation_date || "";
    if (!productId || !date) {
      message.error("Data rekomendasi tidak lengkap untuk diedit");
      return;
    }
    const discountEnabled =
      item?.discountEnabled ??
      item?.discount_enabled ??
      false;
    const rawType =
      item?.discountType ||
      item?.discount_type ||
      (item?.discountType === "amount" ? "nominal" : null);
    const normalizedType =
      rawType === "amount" ? "nominal" : rawType === "nominal" ? "nominal" : "percent";
    const discountPercentValue =
      item?.discountPercent ?? item?.discount_percent ?? null;
    const discountMaxPriceValue =
      item?.discountMaxPrice ?? item?.discount_max_price ?? null;
    const discountAmountValue =
      item?.discountAmount ?? item?.discount_amount ?? null;

    setSelectedDate(date);
    setSelectedProductAbby([]);
    setSelectedProductBev([]);
    setSelectedProductGeneral([]);
    const productMasterSku =
      item?.product?.masterSku ??
      item?.product?.master_sku ??
      item?.masterSku ??
      null;
    const productBrandName =
      item?.product?.brand?.name ??
      item?.brand?.name ??
      null;
    const personaSlug =
      item?.product?.persona?.slug ??
      item?.product?.persona_slug ??
      item?.product?.personaSlug ??
      null;
    const inferredSegment =
      personaSlug === "abby" || personaSlug === "bev"
        ? (personaSlug as "abby" | "bev")
        : inferSegment(productMasterSku, productBrandName);
    const productIdNumber = Number(productId);
    const hasAbbyPick = (productList || []).some(
      (row) => row.segment === "abby" && row.value === productIdNumber,
    );
    const hasBevPick = (productList || []).some(
      (row) => row.segment === "bev" && row.value === productIdNumber,
    );
    const resolvedSegment: "abby" | "bev" | "general" = hasAbbyPick && !hasBevPick
      ? "abby"
      : hasBevPick && !hasAbbyPick
        ? "bev"
        : inferredSegment === "bev"
          ? "bev"
          : inferredSegment === "abby"
            ? "abby"
            : "general";

    const fallbackOption = toProductOption(
      item?.product ?? item,
      resolvedSegment,
    );
    if (fallbackOption) {
      if (resolvedSegment === "general") {
        setSearchProductList((prev) => {
          const exists = (prev || []).some(
            (row) => row.value === fallbackOption.value,
          );
          return exists ? prev : [...prev, fallbackOption];
        });
      } else {
        setProductList((prev) => {
          const exists = (prev || []).some(
            (row) =>
              row.value === fallbackOption.value &&
              row.segment === fallbackOption.segment,
          );
          return exists ? prev : [...prev, fallbackOption];
        });
      }
    }

    if (resolvedSegment === "bev") {
      setSelectedProductBev([productIdNumber]);
    } else if (resolvedSegment === "abby") {
      setSelectedProductAbby([productIdNumber]);
    } else {
      setSelectedProductGeneral([productIdNumber]);
    }
    setEditingRecommendation({
      id: Number(item.id),
      date,
      productId: Number(productId),
    });
    setAddDiscount(Boolean(discountEnabled));
    setDiscountType(normalizedType);
    setDiscountPercent(
      discountEnabled && normalizedType === "percent"
        ? Number(discountPercentValue ?? 0) || null
        : null,
    );
    setDiscountMaxPrice(
      discountEnabled && normalizedType === "percent"
        ? Number(discountMaxPriceValue ?? 0) || null
        : null,
    );
    setDiscountAmount(
      discountEnabled && normalizedType === "nominal"
        ? Number(discountAmountValue ?? 0) || null
        : null,
    );
    setIsModalOpen(true);
  }, [inferSegment, productList, toProductOption]);

  const abbyProductList = useMemo(() => {
    const list = productList || [];
    const out: ProductOption[] = [];
    const seen = new Set<number>();
    list.forEach((row) => {
      if (seen.has(row.value)) return;
      if (row.segment === "abby") {
        seen.add(row.value);
        out.push(row);
      }
    });
    return out;
  }, [productList]);

  const bevProductList = useMemo(() => {
    const list = productList || [];
    const out: ProductOption[] = [];
    const seen = new Set<number>();
    list.forEach((row) => {
      if (seen.has(row.value)) return;
      if (row.segment === "bev") {
        seen.add(row.value);
        out.push(row);
      }
    });
    return out;
  }, [productList]);

  const resolveImageUrl = useCallback((url?: string | null) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    const base = env.ADONIS_API_URL?.replace(/\/+$/, "") || "";
    return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
  }, []);

  const bannerPreviewUrl = useMemo(() => {
    if (bannerForm.imageType === "link") {
      return bannerForm.imageLink ? resolveImageUrl(bannerForm.imageLink) : "";
    }
    if (bannerForm.imageFile) {
      return URL.createObjectURL(bannerForm.imageFile);
    }
    if (bannerForm.imageUrl) return resolveImageUrl(bannerForm.imageUrl);
    return "";
  }, [
    bannerForm.imageFile,
    bannerForm.imageLink,
    bannerForm.imageType,
    bannerForm.imageUrl,
    resolveImageUrl,
  ]);

  const bannerMobilePreviewUrl = useMemo(() => {
    if (bannerForm.imageMobileType === "link") {
      return bannerForm.imageMobileLink
        ? resolveImageUrl(bannerForm.imageMobileLink)
        : "";
    }
    if (bannerForm.imageMobileFile) {
      return URL.createObjectURL(bannerForm.imageMobileFile);
    }
    if (bannerForm.imageMobileUrl)
      return resolveImageUrl(bannerForm.imageMobileUrl);
    return "";
  }, [
    bannerForm.imageMobileFile,
    bannerForm.imageMobileLink,
    bannerForm.imageMobileType,
    bannerForm.imageMobileUrl,
    resolveImageUrl,
  ]);

  // bannerPreviewUrl computed above with imageType awareness

  useEffect(() => {
    return () => {
      if (bannerPreviewUrl && bannerForm.imageFile) {
        URL.revokeObjectURL(bannerPreviewUrl);
      }
      if (bannerMobilePreviewUrl && bannerForm.imageMobileFile) {
        URL.revokeObjectURL(bannerMobilePreviewUrl);
      }
    };
  }, [
    bannerPreviewUrl,
    bannerMobilePreviewUrl,
    bannerForm.imageFile,
    bannerForm.imageMobileFile,
  ]);

  const groupedData = useMemo(() => {
    const map = new Map();
    (data || []).forEach((item: any) => {
      const dateKey = item?.recommendationDate || item?.recommendation_date;
      if (!dateKey) return;
      if (!map.has(dateKey)) {
        map.set(dateKey, { date: dateKey, items: [] as any[] });
      }
      map.get(dateKey).items.push(item);
    });
    const today = wibNow().startOf("day");
    return Array.from(map.values()).sort((a: any, b: any) => {
      const aDate = toWib(a.date)?.startOf("day") || null;
      const bDate = toWib(b.date)?.startOf("day") || null;
      if (!aDate || !bDate) return 0;
      const aFuture = aDate.isAfter(today, "day");
      const bFuture = bDate.isAfter(today, "day");
      if (aFuture !== bFuture) return aFuture ? 1 : -1;
      if (aFuture && bFuture) return aDate.valueOf() - bDate.valueOf();
      return bDate.valueOf() - aDate.valueOf();
    });
  }, [data]);

  const rangeChips = useMemo(() => {
    if (!groupedData.length) return [];
    const dates = groupedData
      .map((g: any) => toWib(g.date))
      .filter((d): d is ReturnType<typeof toWib> => Boolean(d && d.isValid()));
    if (!dates.length) return [];
    const latest = dates.reduce((a, b) => (a!.isAfter(b!) ? a : b))!;
    const base = latest.clone().startOf("month");
    const endDay = latest.clone().endOf("month").date();
    const ranges = [
      [1, 5],
      [6, 10],
      [11, 15],
      [16, 20],
      [21, 25],
      [26, endDay],
    ];

    return ranges.map(([startDay, endDay]) => {
      const start = base.clone().date(startDay).format("YYYY-MM-DD");
      const end = base.clone().date(endDay).format("YYYY-MM-DD");
      const label = `${startDay}-${endDay} ${base.format("MMMM")}`;
      return { start, end, label };
    });
  }, [groupedData]);

  const filteredGroupedData = useMemo(() => {
    if (!rangeFilter) return groupedData;
    const start = toWib(rangeFilter.start);
    const end = toWib(rangeFilter.end);
    if (!start || !end) return groupedData;
    return groupedData.filter((row: any) => {
      const d = toWib(row.date);
      if (!d) return false;
      return d.isBetween(start, end, "day", "[]");
    });
  }, [groupedData, rangeFilter]);

  const findBannerByDate = useCallback(
    (dateStr: string) => {
      const target = toDateKey(dateStr);
      if (!target) return null;
      return (banners || []).find((b: any) => {
        const d = toDateKey(b.bannerDate || b.banner_date || "");
        return d && d === target;
      });
    },
    [banners, toDateKey],
  );

  return {
    data,
    loading,
    isModalOpen,
    setIsModalOpen,
    selectedDate,
    setSelectedDate,
    selectedProductAbby,
    setSelectedProductAbby,
    selectedProductBev,
    setSelectedProductBev,
    selectedProductGeneral,
    setSelectedProductGeneral,
    editingRecommendation,
    setEditingRecommendation,
    addDiscount,
    setAddDiscount,
    discountType,
    setDiscountType,
    discountPercent,
    setDiscountPercent,
    discountMaxPrice,
    setDiscountMaxPrice,
    discountAmount,
    setDiscountAmount,
    maxSelectable,
    maxPerDay: MAX_RECOMMENDATIONS_PER_DAY,
    selectedDateCount,
    recommendationDates,
    productList,
    searchProductList,
    abbyProductList,
    bevProductList,
    productLoading,
    pickLoading,
    rangeFilter,
    setRangeFilter,
    banners,
    bannerLoading,
    bannerModalOpen,
    setBannerModalOpen,
    bannerForm,
    setBannerForm,
    bannerFileList,
    setBannerFileList,
    bannerMobileFileList,
    setBannerMobileFileList,
    bannerPreviewUrl,
    bannerMobilePreviewUrl,
    groupedData,
    rangeChips,
    filteredGroupedData,
    fetchData,
    fetchBanners,
    fetchProducts,
    fetchPickProducts,
    handleSearchProduct,
    handleSubmit,
    handleDelete,
    resetRecommendationForm,
    resetDiscountForm,
    resetBannerForm,
    handleBannerSubmit,
    handleBannerDelete,
    openEditBanner,
    openEditRecommendation,
    resolveImageUrl,
    findBannerByDate,
  };
};

export default useRecommendation;
